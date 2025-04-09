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
        // Set CSS variable for responsive sizing
        document.documentElement.style.setProperty('--current-word-size', currentWordSize);
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
        
        // Better focus handling for mobile devices
        setTimeout(function() {
            const letterBoxes = document.querySelectorAll('.letter-box');
            if (letterBoxes && letterBoxes.length > 0) {
                letterBoxes[0].focus();
                
                // For iOS devices specifically (iPhone/iPad)
                if (/iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream) {
                    // iOS often requires a user interaction to show the keyboard
                    // Make the first letter box more visually prominent
                    letterBoxes[0].classList.add('ready-for-input');
                    
                    // Remove any existing start typing buttons (if they exist from previous code)
                    const existingButtons = document.querySelectorAll('.start-typing-btn');
                    existingButtons.forEach(btn => btn.remove());
                    
                    // Look for an existing hint container
                    let hintContainer = document.querySelector('.hint-container');
                    if (!hintContainer) {
                        // Create a container for hints that will always occupy the same space
                        hintContainer = document.createElement('div');
                        hintContainer.className = 'hint-container';
                        
                        // Insert the fixed container before the word input container
                        const inputSection = document.querySelector('.input-section');
                        if (inputSection && inputSection.firstChild) {
                            inputSection.insertBefore(hintContainer, inputSection.firstChild);
                        }
                    }
                    
                    // Create or update the hint text inside the container
                    hintContainer.innerHTML = ''; // Clear any existing content
                    const hintText = document.createElement('div');
                    hintText.className = 'typing-hint';
                    hintText.textContent = 'Tap any letter to start';
                    hintText.setAttribute('aria-hidden', 'true');
                    
                    // Add the hint text to the fixed container
                    hintContainer.appendChild(hintText);
                    
                    // Auto-hide the hint text (but keep the container) after 5 seconds
                    setTimeout(() => {
                        hintText.classList.add('fade-out');
                        setTimeout(() => {
                            if (hintText.parentNode === hintContainer) {
                                hintText.remove();
                            }
                        }, 1000);
                    }, 5000);
                    
                    // Make every letter box directly interactive
                    letterBoxes.forEach(box => {
                        box.addEventListener('click', function() {
                            this.focus();
                            // Remove the hint when any box is clicked
                            const hint = document.querySelector('.typing-hint');
                            if (hint) hint.remove();
                        });
                    });
                }
            }
        }, 300); // Reduced delay for better responsiveness
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
        
        // When a user starts typing, we activate compact mode
        if (hasLetters) {
            // Once the user starts typing, we add the has-results class to enable compact layout
            document.body.classList.add('has-results');
        }
        
        // If no letters entered, keep the layout but empty the results
        if (!hasLetters) {
            resultsContainer.classList.remove('has-results');
            return;
        }
        
        // Find matching words using our fast solver
        const matches = solver.query(pattern, '.');
        
        // Show or hide results container based on whether we have matches
        if (matches.length > 0) {
            resultsContainer.classList.add('has-results');
        } else {
            resultsContainer.classList.remove('has-results');
        }
        
        // Important: We no longer remove the body has-results class once it's been added
        
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
