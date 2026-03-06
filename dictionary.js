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

// Optimized FastCrosswordSolver — uses native Uint32Array + Math.clz32 instead of BigInt.
// Same algorithm (bitmasked intersection), but ~10-50x faster in practice because:
//   1. Uint32Array flat storage — cache-friendly typed array, no GC pressure
//   2. Native 32-bit bitwise ops — JS bitwise ops are native int32; BigInt is arbitrary-precision
//   3. Math.clz32 for bit scanning — compiles to a single CPU instruction vs bit-by-bit loop
//   4. Flat arithmetic indexing — no string-key hash map lookups per constraint
//   5. First-constraint start — skips all-1s init, saves one AND per block
class FastCrosswordSolver {
    constructor(words) {
        this.wordsByLength = {};
        this._data = {};
        this._preprocess(words);
    }

    _preprocess(words) {
        // Group words by length
        for (const word of words) {
            const len = word.length;
            if (!this.wordsByLength[len]) this.wordsByLength[len] = [];
            this.wordsByLength[len].push(word);
        }

        // Build flat Uint32Array masks for each word length
        for (const len in this.wordsByLength) {
            const wordsForLen = this.wordsByLength[len];
            const wordCount = wordsForLen.length;
            const intsPerMask = (wordCount + 31) >>> 5; // ceil(wordCount / 32)

            // Flat layout: flatMasks[(pos * 26 + charOffset) * intsPerMask + intIndex]
            const flatMasks = new Uint32Array(len * 26 * intsPerMask);

            for (let idx = 0; idx < wordCount; idx++) {
                const word = wordsForLen[idx];
                const intIndex = idx >>> 5;
                const bitMask = 1 << (idx & 31);
                for (let pos = 0; pos < word.length; pos++) {
                    const charOffset = word.charCodeAt(pos) - 97; // 'a' = 97
                    flatMasks[(pos * 26 + charOffset) * intsPerMask + intIndex] |= bitMask;
                }
            }

            this._data[len] = { intsPerMask, flatMasks, wordCount };
        }
    }

    query(pattern, wildcard = '.') {
        const len = pattern.length;
        if (!this.wordsByLength[len]) return [];

        const words = this.wordsByLength[len];
        const { intsPerMask, flatMasks, wordCount } = this._data[len];

        // Collect constraint offsets (pre-computed flat indices)
        const constraints = [];
        for (let pos = 0; pos < len; pos++) {
            const ch = pattern[pos];
            if (ch !== wildcard) {
                const charOffset = ch.toLowerCase().charCodeAt(0) - 97;
                constraints.push((pos * 26 + charOffset) * intsPerMask);
            }
        }

        // All wildcards → return all words
        if (constraints.length === 0) return words.slice();

        const matches = [];
        const constraintCount = constraints.length;
        const c0 = constraints[0];

        for (let i = 0; i < intsPerMask; i++) {
            // Start from first constraint's mask instead of all-1s
            let result = flatMasks[c0 + i];
            for (let c = 1; c < constraintCount; c++) {
                result &= flatMasks[constraints[c] + i];
            }

            // Extract set bits using native 32-bit ops + Math.clz32
            while (result !== 0) {
                const bit = result & (-result);               // isolate lowest set bit
                const bitIndex = 31 - Math.clz32(bit);        // trailing zero count
                const wordIndex = (i << 5) + bitIndex;
                if (wordIndex < wordCount) {
                    matches.push(words[wordIndex]);
                }
                result = (result & (result - 1)) | 0;         // clear lowest set bit
            }
        }

        return matches;
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
