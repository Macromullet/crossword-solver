/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

/**
 * Accessibility enhancements for the Crossword Solver application
 * This module adds accessibility features in an opt-in way without disrupting the default experience
 */
const AccessibilityManager = {
    // State
    active: false,
    highContrastMode: false,
    largeFontMode: false,
    screenReaderMode: false,
    textSpacingMode: false,
    voiceInputMode: false,
    
    // DOM Elements cache
    elements: {
        accessibilityToggle: null,
        accessibilityPanel: null,
        highContrastToggle: null,
        largeFontToggle: null,
        textSpacingToggle: null,
        screenReaderToggle: null,
        voiceInputToggle: null,
        voiceButton: null,
        letterBoxes: []
    },
    
    /**
     * Initialize accessibility features
     */
    init() {
        this.createAccessibilityToggle();
        this.createAccessibilityPanel();
        this.bindEvents();
        
        // Check if accessibility was enabled in previous session
        const savedState = localStorage.getItem('crossword_accessibility');
        if (savedState === 'true') {
            this.toggleAccessibility(true);
        }
    },
    
    /**
     * Create the accessibility toggle button
     */
    createAccessibilityToggle() {
        const toggle = document.createElement('button');
        toggle.id = 'accessibility-toggle';
        toggle.className = 'accessibility-toggle';
        toggle.setAttribute('aria-label', 'Toggle accessibility features');
        toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pointer-events="none"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4m0 4h.01"></path></svg>';
        
        document.body.appendChild(toggle);
        this.elements.accessibilityToggle = toggle;
    },
    
    /**
     * Create the accessibility panel with options
     */
    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.className = 'accessibility-panel';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-labelledby', 'accessibility-title');
        panel.setAttribute('aria-hidden', 'true');
        
        panel.innerHTML = `
            <div class="accessibility-header">
                <h2 id="accessibility-title">Accessibility Options</h2>
                <button class="accessibility-close" aria-label="Close accessibility panel">×</button>
            </div>
            <div class="accessibility-options">
                <div class="accessibility-option">
                    <input type="checkbox" id="high-contrast" class="accessibility-checkbox">
                    <label for="high-contrast">High Contrast Mode</label>
                </div>
                <div class="accessibility-option">
                    <input type="checkbox" id="large-font" class="accessibility-checkbox">
                    <label for="large-font">Large Font Mode</label>
                </div>
                <div class="accessibility-option">
                    <input type="checkbox" id="text-spacing" class="accessibility-checkbox">
                    <label for="text-spacing">Increased Text Spacing</label>
                </div>
                <div class="accessibility-option">
                    <input type="checkbox" id="screen-reader" class="accessibility-checkbox">
                    <label for="screen-reader">Screen Reader Support</label>
                </div>
                <div class="accessibility-option">
                    <input type="checkbox" id="voice-input" class="accessibility-checkbox">
                    <label for="voice-input">Voice Input</label>
                </div>
            </div>
        `;
        
        // Create screen reader mode indicator
        const srIndicator = document.createElement('div');
        srIndicator.className = 'screen-reader-mode-indicator';
        srIndicator.textContent = 'Screen Reader Mode Active';
        srIndicator.setAttribute('aria-hidden', 'true'); // Hide from screen readers as they already know
        document.body.appendChild(srIndicator);
        
        document.body.appendChild(panel);
        this.elements.accessibilityPanel = panel;
        this.elements.highContrastToggle = document.getElementById('high-contrast');
        this.elements.largeFontToggle = document.getElementById('large-font');
        this.elements.textSpacingToggle = document.getElementById('text-spacing');
        this.elements.screenReaderToggle = document.getElementById('screen-reader');
        this.elements.voiceInputToggle = document.getElementById('voice-input');
    },
    
    /**
     * Bind events to interactive elements
     */
    bindEvents() {
        // Accessibility toggle
        this.elements.accessibilityToggle.addEventListener('click', () => {
            this.togglePanel();
            
            // Always ensure accessibility is activated when panel is shown
            if (this.elements.accessibilityPanel.getAttribute('aria-hidden') === 'false') {
                this.toggleAccessibility(true);
            }
        });
        
        // Close button
        const closeButton = document.querySelector('.accessibility-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hidePanel();
            });
        }
        
        // Option toggles
        this.elements.highContrastToggle.addEventListener('change', (e) => {
            this.highContrastMode = e.target.checked;
            this.applySettings();
        });
        
        this.elements.largeFontToggle.addEventListener('change', (e) => {
            this.largeFontMode = e.target.checked;
            this.applySettings();
        });
        
        this.elements.textSpacingToggle.addEventListener('change', (e) => {
            this.textSpacingMode = e.target.checked;
            this.applySettings();
        });
        
        this.elements.screenReaderToggle.addEventListener('change', (e) => {
            this.screenReaderMode = e.target.checked;
            this.applySettings();
        });
        
        this.elements.voiceInputToggle.addEventListener('change', (e) => {
            this.voiceInputMode = e.target.checked;
            this.applySettings();
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            const panel = this.elements.accessibilityPanel;
            const toggle = this.elements.accessibilityToggle;
            
            if (panel.getAttribute('aria-hidden') === 'false' && 
                !panel.contains(e.target) && 
                e.target !== toggle) {
                this.hidePanel();
            }
        });
        
        // Apply enhanced keyboard navigation to letter boxes
        document.addEventListener('DOMNodeInserted', (e) => {
            if (e.target.classList && e.target.classList.contains('letter-box')) {
                this.enhanceLetterBoxAccessibility(e.target);
            }
            
            if (e.target.classList && e.target.classList.contains('result-word')) {
                this.enhanceResultWordAccessibility(e.target);
            }
        });
        
        // Listen for keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key to close panel
            if (e.key === 'Escape' && this.elements.accessibilityPanel.getAttribute('aria-hidden') === 'false') {
                this.hidePanel();
            }
            
            // Alt+A to toggle accessibility panel
            if (e.key === 'a' && e.altKey) {
                e.preventDefault();
                this.togglePanel();
                
                // Ensure accessibility is activated when panel is shown
                if (this.elements.accessibilityPanel.getAttribute('aria-hidden') === 'false') {
                    this.toggleAccessibility(true);
                }
            }
        });
    },
    
    /**
     * Toggle the accessibility panel
     */
    togglePanel() {
        const isHidden = this.elements.accessibilityPanel.getAttribute('aria-hidden') === 'true';
        
        if (isHidden) {
            this.showPanel();
        } else {
            this.hidePanel();
        }
    },
    
    /**
     * Show the accessibility panel
     */
    showPanel() {
        this.elements.accessibilityPanel.setAttribute('aria-hidden', 'false');
        this.elements.accessibilityPanel.classList.add('active');
        this.elements.accessibilityToggle.setAttribute('aria-expanded', 'true');
        
        // Set focus to first checkbox for better keyboard navigation
        setTimeout(() => {
            this.elements.highContrastToggle.focus();
        }, 50);
    },
    
    /**
     * Hide the accessibility panel
     */
    hidePanel() {
        this.elements.accessibilityPanel.setAttribute('aria-hidden', 'true');
        this.elements.accessibilityPanel.classList.remove('active');
        this.elements.accessibilityToggle.setAttribute('aria-expanded', 'false');
        
        // Return focus to the toggle button
        this.elements.accessibilityToggle.focus();
    },
    
    /**
     * Toggle accessibility features on/off
     */
    toggleAccessibility(enable) {
        this.active = enable !== undefined ? enable : !this.active;
        
        if (this.active) {
            document.body.classList.add('accessibility-enabled');
        } else {
            document.body.classList.remove('accessibility-enabled');
            document.body.classList.remove('high-contrast-mode');
            document.body.classList.remove('large-font-mode');
            document.body.classList.remove('text-spacing-mode');
            document.body.classList.remove('screen-reader-mode');
        }
        
        localStorage.setItem('crossword_accessibility', this.active);
        this.applySettings();
    },
    
    /**
     * Apply current accessibility settings
     */
    applySettings() {
        if (!this.active) return;
        
        // High Contrast Mode
        if (this.highContrastMode) {
            document.body.classList.add('high-contrast-mode');
        } else {
            document.body.classList.remove('high-contrast-mode');
        }
        
        // Large Font Mode
        if (this.largeFontMode) {
            document.body.classList.add('large-font-mode');
        } else {
            document.body.classList.remove('large-font-mode');
        }
        
        // Text Spacing Mode
        if (this.textSpacingMode) {
            document.body.classList.add('text-spacing-mode');
        } else {
            document.body.classList.remove('text-spacing-mode');
        }
        
        // Screen Reader Support
        if (this.screenReaderMode) {
            document.body.classList.add('screen-reader-mode');
            this.applyScreenReaderEnhancements();
        } else {
            document.body.classList.remove('screen-reader-mode');
        }
        
        // Voice Input Support
        if (this.voiceInputMode) {
            document.body.classList.add('voice-input-mode');
            this.setupVoiceInput();
        } else {
            document.body.classList.remove('voice-input-mode');
            this.removeVoiceInput();
        }
    },
    
    /**
     * Apply screen reader specific enhancements
     */
    applyScreenReaderEnhancements() {
        // Update ARIA labels for letter boxes
        const letterBoxes = document.querySelectorAll('.letter-box');
        letterBoxes.forEach((box, index) => {
            box.setAttribute('aria-label', `Letter position ${index + 1}`);
            // Add description of what's expected
            box.setAttribute('aria-description', 'Enter a letter for the crossword pattern');
        });
        
        // Add more detailed descriptions to result words
        const resultWords = document.querySelectorAll('.result-word');
        resultWords.forEach(word => {
            const text = word.textContent;
            word.setAttribute('aria-label', `Matching word: ${text}. ${text.split('').join(' ')}`);
            word.setAttribute('aria-description', 'Click to fill this word in the letter boxes');
        });
        
        // Add status region for screen readers
        let statusRegion = document.getElementById('sr-status');
        if (!statusRegion) {
            statusRegion = document.createElement('div');
            statusRegion.id = 'sr-status';
            statusRegion.setAttribute('role', 'status');
            statusRegion.setAttribute('aria-live', 'polite');
            statusRegion.classList.add('sr-only');
            document.body.appendChild(statusRegion);
        }
        
        // Update the results count for screen readers
        const results = document.querySelectorAll('.result-word');
        const count = results.length;
        statusRegion.textContent = count === 0 ? 
            'No matching words found.' : 
            `Found ${count} matching words. Use tab key to navigate through them.`;
    },
    
    /**
     * Enhance accessibility for letter box inputs
     */
    enhanceLetterBoxAccessibility(element) {
        // Add appropriate ARIA attributes
        element.setAttribute('role', 'textbox');
        
        const index = parseInt(element.dataset.index) + 1;
        element.setAttribute('aria-label', `Letter position ${index}`);
        
        // Track for future updates
        this.elements.letterBoxes.push(element);
        
        // If screen reader mode is enabled, apply specific enhancements
        if (this.active && this.screenReaderMode) {
            element.setAttribute('aria-live', 'polite');
        }
    },
    
    /**
     * Enhance accessibility for result words
     */
    enhanceResultWordAccessibility(element) {
        element.setAttribute('role', 'button');
        
        const word = element.textContent;
        element.setAttribute('aria-label', `Select matching word: ${word}`);
        element.setAttribute('tabindex', '0');
        
        // Make clickable via keyboard
        element.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                element.click();
            }
        });
    },

    /**
     * Set up voice input functionality
     */
    setupVoiceInput() {
        // Check if speech recognition is supported
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert('Sorry, your browser does not support speech recognition. Try using Chrome, Edge, or Safari.');
            this.voiceInputMode = false;
            this.elements.voiceInputToggle.checked = false;
            return;
        }
        
        // Create voice button if it doesn't exist
        if (!this.elements.voiceButton) {
            const voiceButton = document.createElement('button');
            voiceButton.id = 'voice-input-button';
            voiceButton.className = 'voice-input-button';
            voiceButton.setAttribute('aria-label', 'Activate voice input');
            voiceButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path><path d="M19 10v2a7 7 0 0 1-14 0v-2"></path><line x1="12" y1="19" x2="12" y2="23"></line><line x1="8" y1="23" x2="16" y2="23"></line></svg>';
            
            document.body.appendChild(voiceButton);
            this.elements.voiceButton = voiceButton;
            
            // Create status indicator for voice input
            const statusIndicator = document.createElement('div');
            statusIndicator.id = 'voice-status';
            statusIndicator.className = 'voice-status';
            statusIndicator.setAttribute('aria-live', 'assertive');
            
            // Provide detailed instructions with examples
            statusIndicator.innerHTML = `
                <h3>Voice Commands:</h3>
                <ul>
                    <li>"A in position 1" - Add letter A to position 1</li>
                    <li>"A space B space" - Add letters with spaces between</li>
                    <li>"Length five" - Change word length to 5</li>
                    <li>"Select apple" - Choose a result word</li>
                    <li>"Clear all" - Reset the crossword</li>
                </ul>
                <p>Click the microphone button to start speaking.</p>
            `;
            
            document.body.appendChild(statusIndicator);
            this.elements.voiceStatus = statusIndicator;
            
            // Initialize speech recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            // Handle recognition results
            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                this.processVoiceCommand(transcript, event.results[0].isFinal);
            };
            
            // Handle recognition end
            this.recognition.onend = () => {
                this.elements.voiceButton.classList.remove('listening');
                this.elements.voiceStatus.textContent = 'Voice input stopped. Click microphone button to restart.';
            };
            
            // Handle recognition errors
            this.recognition.onerror = (event) => {
                this.elements.voiceStatus.textContent = `Error: ${event.error}. Please try again.`;
                this.elements.voiceButton.classList.remove('listening');
            };
            
            // Attach click event to voice button
            this.elements.voiceButton.addEventListener('click', () => {
                if (this.elements.voiceButton.classList.contains('listening')) {
                    this.recognition.stop();
                } else {
                    this.recognition.start();
                    this.elements.voiceButton.classList.add('listening');
                    this.elements.voiceStatus.textContent = 'Listening... Say a letter position or command.';
                }
            });
        } else {
            // If button already exists, just show it
            this.elements.voiceButton.style.display = 'flex';
            this.elements.voiceStatus.style.display = 'block';
        }
    },
    
    /**
     * Remove voice input functionality
     */
    removeVoiceInput() {
        if (this.elements.voiceButton) {
            this.elements.voiceButton.style.display = 'none';
        }
        
        if (this.elements.voiceStatus) {
            this.elements.voiceStatus.style.display = 'none';
        }
        
        if (this.recognition) {
            try {
                this.recognition.stop();
            } catch (e) {
                // Ignore errors when stopping recognition
            }
        }
    },
    
    /**
     * Process voice commands
     */
    processVoiceCommand(transcript, isFinal) {
        if (!isFinal) {
            // For interim results, just show the transcript
            this.updateVoiceStatusWithTranscript(transcript);
            return;
        }
        
        // Process the command
        this.updateVoiceStatusWithProcessing(transcript);
        
        // Handle "length X" command to change word size
        const lengthPattern = /(?:length|size|word size|word length)(?:\s+of)?\s+([2-9]|1[0-5])/i;
        const lengthMatch = transcript.match(lengthPattern);
        
        if (lengthMatch) {
            const wordSize = parseInt(lengthMatch[1]);
            const slider = document.getElementById('word-size-slider');
            
            if (slider && wordSize >= 2 && wordSize <= 15) {
                slider.value = wordSize;
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                this.updateVoiceStatusWithSuccess(`Changed word length to ${wordSize}.`);
            } else {
                this.updateVoiceStatusWithError(`Please use a word size between 2 and 15.`);
            }
            return;
        }
        
        // Handle letter sequence with spaces like "A space B space"
        const spacePattern = /\b([a-z])(?:\s+space\s+|\s+blank\s+)([a-z])(?:\s+space\s+|\s+blank\s+)?(?:([a-z])(?:\s+space\s+|\s+blank\s+)?(?:([a-z])(?:\s+space\s+|\s+blank\s+)?([a-z])?)?)?/i;
        const spaceMatch = transcript.match(spacePattern);
        
        if (spaceMatch) {
            const letterBoxes = document.querySelectorAll('.letter-box');
            const letters = spaceMatch.slice(1).filter(l => l !== undefined);
            
            if (letters.length <= letterBoxes.length) {
                // First clear all letter boxes
                const resetBtn = document.getElementById('reset-btn');
                if (resetBtn) resetBtn.click();
                
                console.log('Processing "A space B space" command with letters:', letters);
                
                // Ensure focus is on the first box for proper entry
                if (letterBoxes.length > 0) {
                    letterBoxes[0].focus();
                }
                
                // Wait a bit for focus to settle
                setTimeout(() => {
                    // Fill in the pattern with spaces between letters
                    this.fillLetterPattern(letterBoxes, letters);
                }, 100);
                
                return;
            }
        }
        
        // Look for letter position commands like "A in position 1" or "put B in box 3"
        const letterPositionPattern = /(?:put\s+)?(letter\s+)?([a-z])\s+(?:in|at)\s+(?:position|box|spot|place|square)?\s*([0-9]+)/i;
        const letterMatch = transcript.match(letterPositionPattern);
        
        if (letterMatch) {
            const letter = letterMatch[2].toUpperCase();
            // Convert to 0-based index for array access
            const position = parseInt(letterMatch[3]) - 1;
            
            // Find letter boxes
            const letterBoxes = document.querySelectorAll('.letter-box');
            console.log('Found letter boxes:', letterBoxes.length, letterBoxes);
            
            if (letterBoxes && position >= 0 && position < letterBoxes.length) {
                // Try different ways to update the letter box value
                try {
                    console.log(`Setting letter ${letter} in position ${position}`);
                    
                    // Method 1: Direct value setting with proper event firing
                    letterBoxes[position].value = letter;
                    letterBoxes[position].dispatchEvent(new Event('input', { bubbles: true }));
                    
                    // Method 2: Focus and simulate typing
                    letterBoxes[position].focus();
                    
                    // Important: Add delay to ensure events are processed
                    setTimeout(() => {
                        // Check if value was set successfully
                        console.log('Current value after setting:', letterBoxes[position].value);
                        
                        if (letterBoxes[position].value !== letter) {
                            console.log('Value not set properly, trying alternative approach');
                            // Alternative approach
                            const event = new InputEvent('input', { 
                                bubbles: true,
                                data: letter,
                                inputType: 'insertText'
                            });
                            letterBoxes[position].dispatchEvent(event);
                        }
                    }, 50);
                    
                    this.updateVoiceStatusWithSuccess(`Placed ${letter} in position ${position + 1}`);
                } catch (error) {
                    console.error('Error setting letter:', error);
                    this.updateVoiceStatusWithError(`Error setting letter: ${error.message}`);
                }
            } else {
                this.updateVoiceStatusWithError(`Invalid position. Please try again with a position between 1 and ${letterBoxes.length}.`);
            }
            return;
        }
        
        // Handle clear/reset command
        if (transcript.match(/clear|reset|start over|clear all/i)) {
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) {
                resetBtn.click();
                this.updateVoiceStatusWithSuccess('Cleared all letter boxes.');
            }
            return;
        }
        
        // Handle reset during a sequence (like "a space b space reset a space c")
        const resetSequencePattern = /(.*?)\s+(?:reset|clear)\s+(.*)/i;
        const resetSequenceMatch = transcript.match(resetSequencePattern);
        
        if (resetSequenceMatch) {
            // First part before reset
            const beforeReset = resetSequenceMatch[1] || '';
            // Second part after reset
            const afterReset = resetSequenceMatch[2] || '';
            
            // Process the first part
            if (beforeReset) {
                this.processVoiceCommand(beforeReset, true);
            }
            
            // Clear all
            const resetBtn = document.getElementById('reset-btn');
            if (resetBtn) {
                resetBtn.click();
            }
            
            // Process the second part
            if (afterReset) {
                // Slight delay to ensure the reset completes first
                setTimeout(() => {
                    this.processVoiceCommand(afterReset, true);
                }, 100);
            }
            return;
        }
        
        // Handle "select word X" commands
        const selectWordPattern = /(?:select|choose|pick)\s+(?:word\s+)?([a-zA-Z]+)/i;
        const wordMatch = transcript.match(selectWordPattern);
        
        if (wordMatch) {
            const targetWord = wordMatch[1].toLowerCase();
            const resultWords = document.querySelectorAll('.result-word');
            
            let found = false;
            resultWords.forEach(wordElement => {
                if (wordElement.textContent.toLowerCase() === targetWord) {
                    wordElement.click();
                    found = true;
                    this.updateVoiceStatusWithSuccess(`Selected word: ${targetWord}`);
                }
            });
            
            if (!found) {
                this.updateVoiceStatusWithError(`Word "${targetWord}" not found in results.`);
            }
            return;
        }
        
        // If no command matched
        this.updateVoiceStatusWithHelp();
    },
    
    /**
     * Update voice status with transcript
     */
    updateVoiceStatusWithTranscript(transcript) {
        this.elements.voiceStatus.innerHTML = `
            <p>I heard: <strong>${transcript}</strong></p>
            <h3>Voice Commands:</h3>
            <ul>
                <li>"A in position 1" - Add letter A to position 1</li>
                <li>"A space B space" - Add letters with spaces between</li>
                <li>"Length five" - Change word length to 5</li>
                <li>"Select apple" - Choose a result word</li>
                <li>"Clear all" - Reset the crossword</li>
            </ul>
        `;
    },
    
    /**
     * Update voice status with processing message
     */
    updateVoiceStatusWithProcessing(transcript) {
        this.elements.voiceStatus.innerHTML = `<p>Processing: <strong>"${transcript}"</strong></p>`;
    },
    
    /**
     * Update voice status with success message
     */
    updateVoiceStatusWithSuccess(message) {
        this.elements.voiceStatus.innerHTML = `
            <p class="voice-success">${message}</p>
            <h3>Voice Commands:</h3>
            <ul>
                <li>"A in position 1" - Add letter A to position 1</li>
                <li>"A space B space" - Add letters with spaces between</li>
                <li>"Length five" - Change word length to 5</li>
                <li>"Select apple" - Choose a result word</li>
                <li>"Clear all" - Reset the crossword</li>
            </ul>
        `;
    },
    
    /**
     * Update voice status with error message
     */
    updateVoiceStatusWithError(message) {
        this.elements.voiceStatus.innerHTML = `
            <p class="voice-error">${message}</p>
            <h3>Voice Commands:</h3>
            <ul>
                <li>"A in position 1" - Add letter A to position 1</li>
                <li>"A space B space" - Add letters with spaces between</li>
                <li>"Length five" - Change word length to 5</li>
                <li>"Select apple" - Choose a result word</li>
                <li>"Clear all" - Reset the crossword</li>
            </ul>
        `;
    },
    
    /**
     * Update voice status with help information
     */
    updateVoiceStatusWithHelp() {
        this.elements.voiceStatus.innerHTML = `
            <p class="voice-error">Command not recognized.</p>
            <h3>Try these commands:</h3>
            <ul>
                <li>"A in position 1" - Add letter A to position 1</li>
                <li>"A space B space" - Add letters with spaces between</li>
                <li>"Length five" - Change word length to 5</li>
                <li>"Select apple" - Choose a result word</li>
                <li>"Clear all" - Reset the crossword</li>
            </ul>
        `;
    },

    /**
     * Fill letter pattern with proper focus management
     * @param {NodeList} letterBoxes - The letter boxes to fill
     * @param {Array} letters - The letters to enter
     */
    fillLetterPattern(letterBoxes, letters) {
        console.log('Starting to fill letter pattern');
        
        // Create a function to fill each box sequentially
        const fillNextLetter = (index) => {
            if (index >= letters.length) {
                this.updateVoiceStatusWithSuccess(`Entered pattern with spaces between letters.`);
                return;
            }
            
            const letterPos = index * 2; // Every other position (with spaces in between)
            if (letterPos < letterBoxes.length) {
                const letter = letters[index].toUpperCase();
                console.log(`Setting letter ${letter} at position ${letterPos}`);
                
                // Focus on the current letter box
                letterBoxes[letterPos].focus();
                
                // Use multiple approaches to ensure the letter is entered
                letterBoxes[letterPos].value = letter;
                
                // Trigger events that the app needs to recognize the input
                const inputEvent = new Event('input', { bubbles: true });
                letterBoxes[letterPos].dispatchEvent(inputEvent);
                
                // Use keydown/keyup events as well which might trigger validation/formatting
                const keyDownEvent = new KeyboardEvent('keydown', {
                    key: letter,
                    code: `Key${letter}`,
                    keyCode: letter.charCodeAt(0),
                    which: letter.charCodeAt(0),
                    bubbles: true
                });
                letterBoxes[letterPos].dispatchEvent(keyDownEvent);
                
                const keyUpEvent = new KeyboardEvent('keyup', {
                    key: letter,
                    code: `Key${letter}`,
                    keyCode: letter.charCodeAt(0),
                    which: letter.charCodeAt(0),
                    bubbles: true
                });
                letterBoxes[letterPos].dispatchEvent(keyUpEvent);
                
                // Check if the value was set correctly
                setTimeout(() => {
                    console.log(`Value at position ${letterPos} is now: ${letterBoxes[letterPos].value}`);
                    
                    // Move to next letter with a slight delay
                    setTimeout(() => fillNextLetter(index + 1), 50);
                }, 50);
            } else {
                fillNextLetter(index + 1);
            }
        };
        
        // Start filling the first letter
        fillNextLetter(0);
    },
};

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    AccessibilityManager.init();
});