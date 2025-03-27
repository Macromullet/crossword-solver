/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

document.addEventListener('DOMContentLoaded', function() {
    const themePicker = document.getElementById('theme-picker');
    const wordSizeSlider = document.getElementById('word-size-slider');
    const sizeDisplay = document.getElementById('size-display');
    const wordInputContainer = document.getElementById('word-input');
    const resultsContainer = document.getElementById('results');
    const mainContainer = document.getElementById('main-container');
    const resetBtn = document.getElementById('reset-btn');
    
    let letterBoxes = [];
    let currentWordSize = 4; // Default word size
    
    // Initialize with the default word size from slider
    generateLetterBoxes(currentWordSize);
    
    // Word size slider functionality
    wordSizeSlider.addEventListener('input', function() {
        currentWordSize = parseInt(this.value);
        sizeDisplay.textContent = currentWordSize;
        generateLetterBoxes(currentWordSize);
    });
    
    // Theme switching functionality
    themePicker.addEventListener('change', function() {
        // Remove all theme classes
        mainContainer.classList.remove(
            'newspaper-theme', 
            'modern-theme', 
            'silly-theme', 
            'google-theme', 
            'apple-theme', 
            'microsoft-theme'
        );
        
        // Add the selected theme class
        mainContainer.classList.add(`${this.value}-theme`);
        
        // For silly theme, add random rotation to elements
        if (this.value === 'silly') {
            applyRandomRotations();
        }
    });
    
    // Reset button functionality
    resetBtn.addEventListener('click', function() {
        generateLetterBoxes(currentWordSize); // Reset to current word size
    });
    
    // Function to apply random rotations for silly theme
    function applyRandomRotations() {
        const elements = document.querySelectorAll('.letter-box, .result-word');
        elements.forEach(el => {
            const rotation = Math.random() * 6 - 3; // Random between -3 and 3 degrees
            el.style.setProperty('--random-rotate', `${rotation}deg`);
        });
    }
    
    // Function to generate letter boxes based on word size
    function generateLetterBoxes(size) {
        // Clear previous boxes and results
        wordInputContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        resultsContainer.classList.remove('has-results');
        letterBoxes = [];
        
        // Create crossword container with border
        const crosswordContainer = document.createElement('div');
        crosswordContainer.className = 'crossword-container';
        
        // Add the border element
        const borderElement = document.createElement('div');
        borderElement.className = 'crossword-border';
        crosswordContainer.appendChild(borderElement);
        
        // Create new letter boxes
        for (let i = 0; i < size; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.className = 'letter-box';
            input.dataset.index = i;
            
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
                    }
                }
                updateResults();
            });
            
            // Handle keyboard navigation
            input.addEventListener('keydown', function(e) {
                const currentIndex = parseInt(this.dataset.index);
                
                if (e.key === 'ArrowRight') {
                    // Right arrow key - move to next box
                    e.preventDefault();
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < letterBoxes.length) {
                        letterBoxes[nextIndex].focus();
                    }
                } else if (e.key === 'ArrowLeft') {
                    // Left arrow key - move to previous box
                    e.preventDefault();
                    const prevIndex = currentIndex - 1;
                    if (prevIndex >= 0) {
                        letterBoxes[prevIndex].focus();
                    }
                } else if (e.key === 'Backspace' && !this.value) {
                    // Backspace on empty box - move to previous box
                    const prevIndex = currentIndex - 1;
                    if (prevIndex >= 0) {
                        letterBoxes[prevIndex].focus();
                    }
                } else if (e.key === ' ') {
                    // Space key - skip to next box without entering a character
                    e.preventDefault();
                    const nextIndex = currentIndex + 1;
                    if (nextIndex < letterBoxes.length) {
                        letterBoxes[nextIndex].focus();
                    }
                }
            });
            
            // Add the input to the crossword container
            crosswordContainer.appendChild(input);
            letterBoxes.push(input);
        }
        
        // Add the crossword container to the word input container
        wordInputContainer.appendChild(crosswordContainer);
        
        // Focus on the first box
        if (letterBoxes.length > 0) {
            letterBoxes[0].focus();
        }
    }
    
    function updateResults() {
        resultsContainer.innerHTML = '';
        
        // Exit if solver isn't loaded yet
        if (!solver) {
            return;
        }
        
        // Get current pattern
        let pattern = '';
        let hasLetters = false;
        
        for (const box of letterBoxes) {
            if (box.value) {
                pattern += box.value.toLowerCase();
                hasLetters = true;
            } else {
                pattern += '.'; // Use dot as wildcard
            }
        }
        
        // Skip search and hide results if no letters entered
        if (!hasLetters) {
            resultsContainer.classList.remove('has-results');
            return;
        }
        
        // Find matching words using our fast solver
        const matches = solver.query(pattern, '.');
        
        // Show results container
        resultsContainer.classList.add('has-results');
        
        // Display results
        if (matches.length === 0) {
            resultsContainer.innerHTML = '<div class="no-matches">No matching words found</div>';
        } else {
            const resultHeader = document.createElement('div');
            resultHeader.className = 'result-header';
            resultHeader.textContent = `Found ${matches.length} matching ${matches.length === 1 ? 'word' : 'words'}:`;
            resultsContainer.appendChild(resultHeader);
            
            // Limit the number of displayed words for better performance
            const displayLimit = 200;
            const displayedMatches = matches.slice(0, displayLimit);
            
            displayedMatches.forEach(word => {
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
                    // Fill the word
                    for (let i = 0; i < letterBoxes.length; i++) {
                        if (i < word.length) {
                            letterBoxes[i].value = word[i].toUpperCase();
                        } else {
                            letterBoxes[i].value = '';
                        }
                    }
                    
                    updateResults();
                });
            });
            
            // Show message if we're displaying only a subset of results
            if (matches.length > displayLimit) {
                const moreMessage = document.createElement('div');
                moreMessage.className = 'more-results';
                moreMessage.textContent = `Showing ${displayLimit} of ${matches.length} matches. Add more letters to narrow results.`;
                resultsContainer.appendChild(moreMessage);
            }
        }
    }
});
