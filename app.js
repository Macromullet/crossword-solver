/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

document.addEventListener('DOMContentLoaded', function() {
    const themePicker = document.getElementById('theme-picker');
    const wordInputContainer = document.getElementById('word-input');
    const resultsContainer = document.getElementById('results');
    const mainContainer = document.getElementById('main-container');
    
    let letterBoxes = [];
    
    // Initialize with a few boxes automatically
    initializeLetterBoxes(5);
    
    // Theme switching functionality
    themePicker.addEventListener('change', function() {
        // Remove all theme classes
        mainContainer.classList.remove('newspaper-theme', 'modern-theme', 'silly-theme');
        
        // Add the selected theme class
        mainContainer.classList.add(`${this.value}-theme`);
        
        // For silly theme, add random rotation to elements
        if (this.value === 'silly') {
            applyRandomRotations();
        }
    });
    
    // Function to apply random rotations for silly theme
    function applyRandomRotations() {
        const elements = document.querySelectorAll('.letter-box, .result-word');
        elements.forEach(el => {
            const rotation = Math.random() * 6 - 3; // Random between -3 and 3 degrees
            el.style.setProperty('--random-rotate', `${rotation}deg`);
        });
    }
    
    // Function to initialize letter boxes
    function initializeLetterBoxes(size) {
        // Clear previous boxes and results
        wordInputContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        letterBoxes = [];
        
        // Create new letter boxes
        for (let i = 0; i < size; i++) {
            addLetterBox(i);
        }
        
        // Add one empty box for expansion
        addEmptyBox();
        
        // Focus on the first box
        if (letterBoxes.length > 0) {
            letterBoxes[0].focus();
        }
    }
    
    // Function to add a single letter box
    function addLetterBox(index) {
        const input = document.createElement('input');
        input.type = 'text';
        input.maxLength = 1;
        input.className = 'letter-box';
        input.dataset.index = index;
        
        // If we're in silly theme, apply random rotation
        if (themePicker.value === 'silly') {
            const rotation = Math.random() * 6 - 3; // Random between -3 and 3 degrees
            input.style.setProperty('--random-rotate', `${rotation}deg`);
        }
        
        // Handle input changes
        input.addEventListener('input', function(e) {
            this.value = this.value.toUpperCase();
            if (this.value) {
                // Move focus to next input if available
                const nextIndex = parseInt(this.dataset.index) + 1;
                if (nextIndex < letterBoxes.length) {
                    letterBoxes[nextIndex].focus();
                } else if (this === letterBoxes[letterBoxes.length - 1]) {
                    // If this is the last box and we entered a letter, add a new empty box
                    addEmptyBox();
                }
            }
            updateResults();
        });
        
        // Handle special key presses
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Backspace' && !this.value) {
                // If backspace on empty box, delete it unless it's the first or last box
                const currentIndex = parseInt(this.dataset.index);
                if (currentIndex > 0 && currentIndex === letterBoxes.length - 2) {
                    e.preventDefault();
                    const prevBox = letterBoxes[currentIndex - 1];
                    removeLetterBox(this);
                    prevBox.focus();
                    return;
                }
                
                // Otherwise just move to previous box
                const prevIndex = currentIndex - 1;
                if (prevIndex >= 0) {
                    letterBoxes[prevIndex].focus();
                }
            } else if (e.key === ' ') {
                // Space key moves to the next box without entering a character
                e.preventDefault();
                const nextIndex = parseInt(this.dataset.index) + 1;
                if (nextIndex < letterBoxes.length) {
                    letterBoxes[nextIndex].focus();
                } else {
                    // If at the last box, add a new box
                    addEmptyBox();
                }
            }
        });
        
        letterBoxes.push(input);
        wordInputContainer.appendChild(input);
        return input;
    }
    
    // Function to add empty box at the end
    function addEmptyBox() {
        // Add a new box at the end for expansion
        const newIndex = letterBoxes.length;
        const newBox = addLetterBox(newIndex);
        
        // Check if we should focus on it
        if (letterBoxes[newIndex - 1].value !== '') {
            newBox.focus();
        }
        
        // Update results after adding a new box
        updateResults();
    }
    
    // Function to remove a letter box
    function removeLetterBox(box) {
        const index = parseInt(box.dataset.index);
        wordInputContainer.removeChild(box);
        
        // Remove from array
        letterBoxes.splice(index, 1);
        
        // Update indices of remaining boxes
        for (let i = index; i < letterBoxes.length; i++) {
            letterBoxes[i].dataset.index = i;
        }
        
        // Update results after removing a box
        updateResults();
    }
    
    function updateResults() {
        resultsContainer.innerHTML = '';
        
        // Exit if solver isn't loaded yet
        if (!solver) {
            resultsContainer.innerHTML = '<div class="loading">Loading dictionary...</div>';
            return;
        }
        
        // Get current pattern, excluding the last empty box used for expansion
        let pattern = '';
        
        for (let i = 0; i < letterBoxes.length - 1; i++) {
            if (letterBoxes[i].value) {
                pattern += letterBoxes[i].value.toLowerCase();
            } else {
                pattern += '.'; // Use dot as wildcard
            }
        }
        
        // Skip search if pattern is too short or all wildcards
        if (pattern.length === 0 || pattern === '.'.repeat(pattern.length)) {
            return;
        }
        
        // Find matching words using our fast solver
        const matches = solver.query(pattern, '.');
        
        // Display results
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-matches">No matching words found</div>';
        } else {
            const resultHeader = document.createElement('div');
            resultHeader.className = 'result-header';
            resultHeader.textContent = `Found ${matches.length} matching words:`;
            resultsContainer.appendChild(resultHeader);
            
            matches.forEach(word => {
                const wordElement = document.createElement('div');
                wordElement.className = 'result-word';
                wordElement.textContent = word;
                
                // If in silly theme, apply random rotation
                if (themePicker.value === 'silly') {
                    const rotation = Math.random() * 6 - 3; // Random between -3 and 3 degrees
                    wordElement.style.setProperty('--random-rotate', `${rotation}deg`);
                }
                
                resultsContainer.appendChild(wordElement);
                
                // Add click behavior to fill in the word
                wordElement.addEventListener('click', function() {
                    // Resize boxes if needed - make sure we have enough boxes
                    while (letterBoxes.length - 1 < word.length) {
                        addEmptyBox();
                    }
                    
                    // Fill the word
                    for (let i = 0; i < word.length; i++) {
                        letterBoxes[i].value = word[i].toUpperCase();
                    }
                    
                    // Clear any extra boxes
                    for (let i = word.length; i < letterBoxes.length - 1; i++) {
                        letterBoxes[i].value = '';
                    }
                    
                    updateResults();
                });
            });
        }
    }
});
