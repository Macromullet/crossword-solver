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
    
    // DOM Elements cache
    elements: {
        accessibilityToggle: null,
        accessibilityPanel: null,
        highContrastToggle: null,
        largeFontToggle: null,
        screenReaderToggle: null,
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
        toggle.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M12 8v4m0 4h.01"></path></svg>';
        
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
                    <input type="checkbox" id="screen-reader" class="accessibility-checkbox">
                    <label for="screen-reader">Screen Reader Support</label>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.elements.accessibilityPanel = panel;
        this.elements.highContrastToggle = document.getElementById('high-contrast');
        this.elements.largeFontToggle = document.getElementById('large-font');
        this.elements.screenReaderToggle = document.getElementById('screen-reader');
    },
    
    /**
     * Bind events to interactive elements
     */
    bindEvents() {
        // Accessibility toggle
        this.elements.accessibilityToggle.addEventListener('click', () => {
            this.togglePanel();
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
        
        this.elements.screenReaderToggle.addEventListener('change', (e) => {
            this.screenReaderMode = e.target.checked;
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
        
        // Listen for Escape key to close panel
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.accessibilityPanel.getAttribute('aria-hidden') === 'false') {
                this.hidePanel();
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
    },
    
    /**
     * Hide the accessibility panel
     */
    hidePanel() {
        this.elements.accessibilityPanel.setAttribute('aria-hidden', 'true');
        this.elements.accessibilityPanel.classList.remove('active');
        this.elements.accessibilityToggle.setAttribute('aria-expanded', 'false');
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
        
        // Screen Reader Support
        if (this.screenReaderMode) {
            document.body.classList.add('screen-reader-mode');
            this.applyScreenReaderEnhancements();
        } else {
            document.body.classList.remove('screen-reader-mode');
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
        });
        
        // Add more detailed descriptions to result words
        const resultWords = document.querySelectorAll('.result-word');
        resultWords.forEach(word => {
            const text = word.textContent;
            word.setAttribute('aria-label', `Matching word: ${text}. ${text.split('').join(' ')}`);
        });
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
    }
};

// Initialize when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    AccessibilityManager.init();
});