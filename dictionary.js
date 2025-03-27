// This file will load and process the dictionary using a fast bit-manipulation algorithm

// Dictionary array that will be available to app.js
let dictionary = [];

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
function loadFallbackDictionary() {
    updateLoadingProgress('Using built-in dictionary...');
    
    // Include a small set of common words directly in the JS file as a fallback
    const fallbackDictionary = [
        "apple", "banana", "orange", "grape", "lemon", "cherry", "peach",
        "computer", "keyboard", "mouse", "monitor", "laptop", "tablet", "phone",
        "table", "chair", "sofa", "desk", "bed", "lamp", "clock", "window", "door",
        "water", "coffee", "tea", "juice", "milk", "bread", "butter", "cheese",
        "happy", "smile", "laugh", "enjoy", "friend", "family", "house", "garden",
        "hello", "world", "earth", "space", "star", "moon", "sun", "planet", "ocean",
        "green", "blue", "red", "yellow", "black", "white", "purple", "orange",
        "small", "large", "tiny", "huge", "fast", "slow", "early", "late", "now",
        "plant", "tree", "flower", "grass", "river", "lake", "mountain", "valley"
    ];
    
    // Use the fallback dictionary
    dictionary = fallbackDictionary;
    updateLoadingProgress(`Using ${dictionary.length} built-in words. Initializing solver...`);
    
    // Initialize the solver with the fallback dictionary
    solver = new FastCrosswordSolver(dictionary);
    
    updateLoadingProgress(`Solver ready with ${dictionary.length} words!`);
    
    // Show the main interface after a short delay
    setTimeout(() => {
        showMainInterface();
    }, 1000);
}

// Function to load the dictionary from TXT
async function loadDictionary() {
    try {
        updateLoadingProgress('Fetching dictionary...');
        const response = await fetch('dictionary.txt');
        if (!response.ok) {
            throw new Error(`Failed to load dictionary (Status ${response.status})`);
        }
        
        const data = await response.text();
        
        updateLoadingProgress('Processing dictionary...');
        // Split the TXT data into words (one word per line)
        dictionary = data.split('\n')
            .map(word => word.trim().toLowerCase())
            .filter(word => word.length > 0)
            .filter(word => /^[a-z]+$/.test(word)); // Only include words with a-z letters
        
        if (dictionary.length === 0) {
            throw new Error('Dictionary is empty');
        }
        
        updateLoadingProgress(`Dictionary loaded with ${dictionary.length} words. Initializing solver...`);
        
        // Initialize the solver with the dictionary
        solver = new FastCrosswordSolver(dictionary);
        
        updateLoadingProgress(`Solver ready with ${dictionary.length} words!`);
        
        // Short timeout to show the final message before showing the main interface
        setTimeout(() => {
            showMainInterface();
        }, 1000);
        
        console.log(`Dictionary loaded with ${dictionary.length} words`);
    } catch (error) {
        console.error('Error loading dictionary:', error);
        updateLoadingProgress(`Error loading dictionary: ${error.message}. Using fallback dictionary...`);
        
        // If fetch fails (which is likely when running from file://)
        // use the fallback dictionary instead
        loadFallbackDictionary();
    }
}

// Load the dictionary when the page loads
document.addEventListener('DOMContentLoaded', loadDictionary);
