/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

// This file will load and process the dictionary using a fast bit-manipulation algorithm

// Dictionary arrays for different languages
let dictionaries = {
    en: [], // English
    es: [], // Spanish
    fr: [], // French
    de: []  // German
};

// Currently active dictionary
let dictionary = [];

// Currently selected language
let currentLanguage = 'en';

// The FastCrosswordSolver class converted from C#
class FastCrosswordSolver {
    constructor(words) {
        // Group words by their length
        this.wordsByLength = {};
        
        // For each word length, map (position, letter) to an array of 64-bit masks
        this.masks = {};
        
        // For each word length, store the number of 64-bit blocks needed
        this.blocksCount = {};
        
        // Preprocess the dictionary
        this.preprocess(words);
    }
    
    preprocess(words) {
        // Group words by their length
        for (const word of words) {
            const length = word.length;
            if (!this.wordsByLength[length]) {
                this.wordsByLength[length] = [];
            }
            this.wordsByLength[length].push(word);
        }
        
        // For each word length, create and populate bit mask arrays
        for (const length in this.wordsByLength) {
            const wordsForLength = this.wordsByLength[length];
            const wordCount = wordsForLength.length;
            const nblocks = Math.floor((wordCount + 63) / 64);
            this.blocksCount[length] = nblocks;
            this.masks[length] = {};
            
            // Initialize a mask array for every position and letter
            for (let pos = 0; pos < length; pos++) {
                for (const letter of "abcdefghijklmnopqrstuvwxyz") {
                    this.masks[length][`${pos},${letter}`] = new Array(nblocks).fill(0n);
                }
            }
            
            // Populate the masks: for each word, set the corresponding bit
            for (let index = 0; index < wordCount; index++) {
                const word = wordsForLength[index];
                const block = Math.floor(index / 64);
                const bitOffset = index % 64;
                for (let pos = 0; pos < word.length; pos++) {
                    const letter = word[pos].toLowerCase();
                    // Use BigInt for 64-bit integer operations
                    this.masks[length][`${pos},${letter}`][block] |= 1n << BigInt(bitOffset);
                }
            }
        }
    }
    
    query(pattern, wildcard = '.') {
        const length = pattern.length;
        if (!this.wordsByLength[length]) {
            return []; // No words of this length
        }
        
        const words = this.wordsByLength[length];
        const nblocks = this.blocksCount[length];
        
        // Start with a result mask array with all bits set (i.e., all words are candidates)
        const resultMask = new Array(nblocks).fill(0n);
        for (let i = 0; i < nblocks; i++) {
            resultMask[i] = ~0n;
        }
        
        // In the final block, clear any extra bits beyond the word count
        const extra = nblocks * 64 - words.length;
        if (extra > 0) {
            resultMask[nblocks - 1] &= (~0n) >> BigInt(extra);
        }
        
        // For each fixed letter in the pattern, intersect its mask
        for (let pos = 0; pos < length; pos++) {
            const letter = pattern[pos];
            if (letter === wildcard) {
                continue;
            }
            
            const lowerLetter = letter.toLowerCase();
            const letterMask = this.masks[length][`${pos},${lowerLetter}`];
            
            // Apply the mask using bitwise AND
            for (let i = 0; i < nblocks; i++) {
                resultMask[i] &= letterMask[i];
            }
        }
        
        // Extract the matching word indices from the resultMask
        const matches = [];
        for (let block = 0; block < nblocks; block++) {
            let mask = resultMask[block];
            while (mask !== 0n) {
                // Find the position of the lowest set bit
                const bitIndex = this.trailingZeroCount(mask);
                const wordIndex = block * 64 + Number(bitIndex);
                if (wordIndex < words.length) {
                    matches.push(words[wordIndex]);
                }
                // Clear the lowest set bit
                mask &= mask - 1n;
            }
        }
        
        return matches;
    }
    
    // Utility function to count trailing zeros in a BigInt
    trailingZeroCount(n) {
        if (n === 0n) return 64;
        let count = 0n;
        while ((n & 1n) === 0n) {
            count++;
            n >>= 1n;
        }
        return count;
    }
}

// Our solver instance
let solver = null;

// Function to update loading progress
function updateLoadingProgress(message) {
    const progressElement = document.getElementById('loading-progress');
    if (progressElement) {
        progressElement.textContent = message;
    }
}

// Function to show main container and hide loading screen
function showMainInterface() {
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-container').classList.remove('hidden');
}

// Alternative method to provide dictionary when fetch fails
function loadFallbackDictionary(lang = 'en') {
    updateLoadingProgress(`Using built-in ${lang} dictionary...`);
    
    // Include small sets of common words in different languages as fallback
    const fallbackDictionaries = {
        en: [
            "apple", "banana", "orange", "grape", "lemon", "cherry", "peach",
            "computer", "keyboard", "mouse", "monitor", "laptop", "tablet", "phone",
            "table", "chair", "sofa", "desk", "bed", "lamp", "clock", "window", "door",
            "water", "coffee", "tea", "juice", "milk", "bread", "butter", "cheese",
            "happy", "smile", "laugh", "enjoy", "friend", "family", "house", "garden",
            "hello", "world", "earth", "space", "star", "moon", "sun", "planet", "ocean",
            "green", "blue", "red", "yellow", "black", "white", "purple", "orange",
            "small", "large", "tiny", "huge", "fast", "slow", "early", "late", "now",
            "plant", "tree", "flower", "grass", "river", "lake", "mountain", "valley"
        ],
        es: [
            "casa", "perro", "gato", "libro", "mesa", "silla", "coche", "agua",
            "comida", "tiempo", "ciudad", "pais", "mundo", "vida", "trabajo",
            "escuela", "amigo", "familia", "padre", "madre", "hijo", "hija",
            "hermano", "hermana", "mujer", "hombre", "mano", "pie", "cabeza",
            "amor", "feliz", "triste", "grande", "alto", "bajo", "blanco", "negro",
            "rojo", "azul", "verde", "amarillo", "sol", "luna", "cielo", "tierra",
            "aire", "fuego", "playa", "mar", "rio", "arbol", "flor", "planta"
        ],
        fr: [
            "maison", "chien", "chat", "livre", "table", "chaise", "voiture", "eau",
            "nourriture", "temps", "ville", "pays", "monde", "vie", "travail",
            "ecole", "ami", "famille", "pere", "mere", "fils", "fille",
            "frere", "soeur", "femme", "homme", "main", "pied", "tete",
            "amour", "heureux", "triste", "grand", "haut", "bas", "blanc", "noir",
            "rouge", "bleu", "vert", "jaune", "soleil", "lune", "ciel", "terre",
            "air", "feu", "plage", "mer", "riviere", "arbre", "fleur", "plante"
        ],
        de: [
            "haus", "hund", "katze", "buch", "tisch", "stuhl", "auto", "wasser",
            "essen", "zeit", "stadt", "land", "welt", "leben", "arbeit",
            "schule", "freund", "familie", "vater", "mutter", "sohn", "tochter",
            "bruder", "schwester", "frau", "mann", "hand", "fuss", "kopf",
            "liebe", "gluck", "traurig", "gross", "hoch", "niedrig", "weiss", "schwarz",
            "rot", "blau", "grun", "gelb", "sonne", "mond", "himmel", "erde",
            "luft", "feuer", "strand", "meer", "fluss", "baum", "blume", "pflanze"
        ]
    };
    
    // Get the fallback for requested language or default to English
    const fallbackDictionary = fallbackDictionaries[lang] || fallbackDictionaries.en;
    
    // Set global current language
    currentLanguage = lang;
    
    // Store in dictionaries object
    dictionaries[lang] = fallbackDictionary;
    
    // Use the fallback dictionary
    dictionary = fallbackDictionary;
    updateLoadingProgress(`Using ${dictionary.length} built-in ${lang.toUpperCase()} words. Initializing solver...`);
    
    // Initialize the solver with the fallback dictionary
    solver = new FastCrosswordSolver(dictionary);
    
    updateLoadingProgress(`Solver ready with ${dictionary.length} words!`);
    
    // Show the main interface after a short delay
    setTimeout(() => {
        showMainInterface();
    }, 1000);
}

// Detect user's browser language
function detectBrowserLanguage() {
    const userLang = navigator.language || navigator.userLanguage;
    if (userLang.startsWith('es')) {
        return 'es';
    } else if (userLang.startsWith('fr')) {
        return 'fr';
    } else if (userLang.startsWith('de')) {
        return 'de';
    } else {
        return 'en';
    }
}

// Function to switch dictionaries
function switchDictionary(lang) {
    if (!['en', 'es', 'fr', 'de'].includes(lang)) {
        console.error(`Invalid language code: ${lang}`);
        return;
    }
    
    // Update UI language buttons
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
    });
    
    const langBtn = document.getElementById(`lang-${lang}`);
    if (langBtn) {
        langBtn.classList.add('active');
        langBtn.setAttribute('aria-pressed', 'true');
    }
    
    // Don't reload if already loaded and selected
    if (currentLanguage === lang && dictionaries[lang].length > 0) {
        return;
    }
    
    currentLanguage = lang;
    
    // Show the loading screen if we need to load a new dictionary
    if (dictionaries[lang].length === 0) {
        document.getElementById('loading-screen').classList.remove('hidden');
    }
    
    // If dictionary for this language is already loaded, just switch to it
    if (dictionaries[lang].length > 0) {
        dictionary = dictionaries[lang];
        // Initialize the solver with the dictionary
        solver = new FastCrosswordSolver(dictionary);
        
        // Trigger a search update to refresh the results with the new dictionary
        triggerResultsUpdate();
        
        return;
    }
    
    // Otherwise load the dictionary for selected language
    loadDictionaryForLanguage(lang);
}

// Function to trigger a results update in app.js
function triggerResultsUpdate() {
    const letterBoxes = document.querySelectorAll('.letter-box');
    if (letterBoxes && letterBoxes.length > 0) {
        // Create and dispatch an input event on the first letter box
        // This will trigger the updateResults function in app.js
        const inputEvent = new Event('input', { bubbles: true });
        letterBoxes[0].dispatchEvent(inputEvent);
    }
}

/*
 * Dictionary source attribution:
 * These dictionaries are sourced from the Letterpress Word List project:
 * https://github.com/lorenbrichter/Words
 * Licensed under CC0-1.0 license (Creative Commons Zero v1.0 Universal)
 */

// Function to load the dictionary for a specific language
async function loadDictionaryForLanguage(lang) {
    try {
        updateLoadingProgress(`Loading ${lang.toUpperCase()} dictionary...`);
        
        // Use the new dictionaries from the dictionaries folder
        const response = await fetch(`dictionaries/${lang}.txt`);
        if (!response.ok) {
            throw new Error(`Failed to load ${lang} dictionary (Status ${response.status})`);
        }
        
        const data = await response.text();
        
        updateLoadingProgress(`Processing ${lang} dictionary...`);
        // Split the TXT data into words (one word per line)
        // Filter to ensure we only keep words with standard Latin alphabet (a-z)
        dictionaries[lang] = data.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0)
            .filter(word => /^[a-z]+$/.test(word)); // All dictionaries use only a-z
        
        if (dictionaries[lang].length === 0) {
            throw new Error(`${lang} dictionary is empty`);
        }
        
        // Set current dictionary to the loaded one
        dictionary = dictionaries[lang];
        currentLanguage = lang;
        
        const wordCount = dictionary.length.toLocaleString();
        updateLoadingProgress(`${lang.toUpperCase()} dictionary loaded with ${wordCount} words. Initializing solver...`);
        
        // Initialize the solver with the dictionary
        solver = new FastCrosswordSolver(dictionary);
        
        updateLoadingProgress(`Solver ready with ${wordCount} words!`);
        
        // Show the main interface after a short delay
        setTimeout(() => {
            showMainInterface();
            
            // Update app.js that dictionary has changed
            triggerResultsUpdate();
        }, 1000);
        
        console.log(`${lang} dictionary loaded with ${wordCount} words from Letterpress Word List`);
    } catch (error) {
        console.error(`Error loading ${lang} dictionary:`, error);
        updateLoadingProgress(`Error loading ${lang} dictionary: ${error.message}. Using fallback...`);
        
        // If fetch fails, use the fallback dictionary
        loadFallbackDictionary(lang);
    }
}

// Function to load the dictionaries
async function loadDictionary() {
    // Detect user's browser language
    const detectedLang = detectBrowserLanguage();
    
    document.getElementById('loading-screen').classList.remove('hidden');
    
    try {
        // Load the detected language first
        await loadDictionaryForLanguage(detectedLang);
        
        // Short timeout to show the final message before showing the main interface
        setTimeout(() => {
            showMainInterface();
        }, 1000);
        
    } catch (error) {
        console.error('Error during dictionary initialization:', error);
        updateLoadingProgress(`Error during dictionary initialization. Using fallback...`);
        loadFallbackDictionary(detectedLang);
    }
}

// Load the dictionary when the page loads
document.addEventListener('DOMContentLoaded', loadDictionary);
