/*
 * Copyright (c) 2025 Brooke Philpott
 * 
 * This file is part of the Crossword Solver application.
 * Licensed under the MIT License. See LICENSE.md for details.
 */

// Language management for the Crossword Solver app
const LanguageManager = {
    // Current language
    currentLanguage: 'en',
    
    // Translations for UI elements
    translations: {
        en: {
            appTitle: 'Crossword Solver',
            theme: 'Theme',
            wordSize: 'Word Size',
            clear: 'Clear',
            loadingTitle: 'Loading Dictionary',
            loading: 'Loading',
            initializing: 'Initializing...',
            inputInstructions: 'Enter your crossword clue below',
            noResults: 'No matching words found',
            resultCount: '{count} words found'
        },
        es: {
            appTitle: 'Solucionador de Crucigramas',
            theme: 'Tema',
            wordSize: 'Tamaño',
            clear: 'Borrar',
            loadingTitle: 'Cargando Diccionario',
            loading: 'Cargando',
            initializing: 'Inicializando...',
            inputInstructions: 'Introduce tu pista de crucigrama',
            noResults: 'No se encontraron palabras',
            resultCount: '{count} palabras encontradas'
        },
        fr: {
            appTitle: 'Solveur de Mots Croisés',
            theme: 'Thème',
            wordSize: 'Taille',
            clear: 'Effacer',
            loadingTitle: 'Chargement du Dictionnaire',
            loading: 'Chargement',
            initializing: 'Initialisation...',
            inputInstructions: 'Entrez votre indice de mots croisés',
            noResults: 'Aucun mot trouvé',
            resultCount: '{count} mots trouvés'
        },
        de: {
            appTitle: 'Kreuzworträtsel-Löser',
            theme: 'Thema',
            wordSize: 'Wortgröße',
            clear: 'Löschen',
            loadingTitle: 'Wörterbuch wird geladen',
            loading: 'Laden',
            initializing: 'Initialisiere...',
            inputInstructions: 'Geben Sie Ihren Kreuzworträtselhinweis ein',
            noResults: 'Keine passenden Wörter gefunden',
            resultCount: '{count} Wörter gefunden'
        }
    },
    
    // Keyboard layouts for mobile input
    keyboardLayouts: {
        en: ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'],
        es: ['qwertyuiop', 'asdfghjklñ', 'zxcvbnm'],
        fr: ['azertyuiop', 'qsdfghjklm', 'wxcvbn'],
        de: ['qwertzuiop', 'asdfghjkl', 'yxcvbnm']
    },
    
    // Initialize language based on browser or saved preference
    init() {
        // Check if a language preference is saved
        const savedLang = localStorage.getItem('crossword_language');
        if (savedLang && ['en', 'es', 'fr'].includes(savedLang)) {
            this.currentLanguage = savedLang;
        } else {
            // Detect browser language
            this.currentLanguage = this.detectBrowserLanguage();
        }
        
        // Set up language switcher buttons
        this.setupLanguageSwitcher();
        
        // Apply current language
        this.applyLanguage(this.currentLanguage);
    },
    
    // Detect browser language
    detectBrowserLanguage() {
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
    },
    
    // Set up language switcher buttons
    setupLanguageSwitcher() {
        document.getElementById('lang-en').addEventListener('click', () => {
            this.changeLanguage('en');
            switchDictionary('en');
        });
        
        document.getElementById('lang-es').addEventListener('click', () => {
            this.changeLanguage('es');
            switchDictionary('es');
        });
        
        document.getElementById('lang-fr').addEventListener('click', () => {
            this.changeLanguage('fr');
            switchDictionary('fr');
        });
        
        document.getElementById('lang-de').addEventListener('click', () => {
            this.changeLanguage('de');
            switchDictionary('de');
        });
        
        // Set initial active state
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        const currentLangBtn = document.getElementById(`lang-${this.currentLanguage}`);
        if (currentLangBtn) {
            currentLangBtn.classList.add('active');
            currentLangBtn.setAttribute('aria-pressed', 'true');
        }
    },
    
    // Change language
    changeLanguage(lang) {
        if (!['en', 'es', 'fr', 'de'].includes(lang)) {
            console.error(`Invalid language code: ${lang}`);
            return;
        }
        
        // Update active button
        document.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-pressed', 'false');
        });
        
        const langBtn = document.getElementById(`lang-${lang}`);
        if (langBtn) {
            langBtn.classList.add('active');
            langBtn.setAttribute('aria-pressed', 'true');
        }
        
        // Save preference
        localStorage.setItem('crossword_language', lang);
        
        // Set current language
        this.currentLanguage = lang;
        
        // Apply translations
        this.applyLanguage(lang);
        
        // Switch virtual keyboard if visible
        this.updateVirtualKeyboard();
    },
    
    // Apply language translations to UI
    applyLanguage(lang) {
        const texts = this.translations[lang] || this.translations.en;
        
        // Update app title
        document.querySelector('.app-title').textContent = texts.appTitle;
        document.title = texts.appTitle;
        
        // Update theme label
        const themeLabel = document.querySelector('.theme-selector label');
        if (themeLabel) {
            themeLabel.textContent = texts.theme + ':';
        }
        
        // Update word size label
        const wordSizeLabel = document.querySelector('.word-size-control label');
        if (wordSizeLabel) {
            const sizeDisplay = wordSizeLabel.querySelector('#size-display');
            const currentSize = sizeDisplay ? sizeDisplay.textContent : '4';
            wordSizeLabel.childNodes[0].textContent = texts.wordSize + ': ';
        }
        
        // Update input instructions
        const inputInstructions = document.querySelector('.input-instructions');
        if (inputInstructions) {
            // Keep structure for mobile optimization
            let mobileHideStart = inputInstructions.querySelector('.mobile-hide:first-child');
            let mobileHideEnd = inputInstructions.querySelector('.mobile-hide:last-child');
            
            if (mobileHideStart && mobileHideEnd) {
                mobileHideStart.textContent = lang === 'en' ? 'Enter your ' : '';
                inputInstructions.childNodes[1].textContent = texts.inputInstructions;
                mobileHideEnd.textContent = lang === 'en' ? ' below' : '';
            } else {
                inputInstructions.textContent = texts.inputInstructions;
            }
        }
        
        // Update reset button
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) {
            resetBtn.textContent = texts.clear;
        }
        
        // Update loading screen if visible
        const loadingTitle = document.querySelector('.loading-title');
        if (loadingTitle) {
            loadingTitle.textContent = texts.loadingTitle;
        }
        
        const loadingLetters = document.querySelector('.dancing-letters');
        if (loadingLetters) {
            // Replace dancing letters with the word "Loading" in the current language
            loadingLetters.innerHTML = '';
            const loadingWord = texts.loading.toUpperCase();
            for (let i = 0; i < loadingWord.length; i++) {
                const span = document.createElement('span');
                span.textContent = loadingWord[i];
                loadingLetters.appendChild(span);
            }
        }
        
        // HTML lang attribute
        document.documentElement.setAttribute('lang', lang);
    },
    
    // Update virtual keyboard for mobile input
    updateVirtualKeyboard() {
        const virtualKeyboard = document.getElementById('virtual-keyboard');
        if (!virtualKeyboard) {
            return;
        }
        
        // Get keyboard layout for current language
        const layout = this.keyboardLayouts[this.currentLanguage] || this.keyboardLayouts.en;
        
        // Clear existing keyboard
        virtualKeyboard.innerHTML = '';
        
        // Create keyboard rows
        layout.forEach(row => {
            const keyboardRow = document.createElement('div');
            keyboardRow.className = 'keyboard-row';
            
            // Create keys for this row
            for (let i = 0; i < row.length; i++) {
                const key = document.createElement('button');
                key.className = 'keyboard-key';
                key.textContent = row[i].toUpperCase();
                key.setAttribute('data-key', row[i]);
                key.setAttribute('type', 'button');
                key.setAttribute('aria-label', `${row[i].toUpperCase()} key`);
                
                // Add click handler
                key.addEventListener('click', () => {
                    this.onVirtualKeyPress(row[i]);
                });
                
                keyboardRow.appendChild(key);
            }
            
            virtualKeyboard.appendChild(keyboardRow);
        });
        
        // Add space key and backspace key
        const utilityRow = document.createElement('div');
        utilityRow.className = 'keyboard-row';
        
        // Backspace key
        const backspaceKey = document.createElement('button');
        backspaceKey.className = 'keyboard-key wide-key';
        backspaceKey.innerHTML = '&larr;';
        backspaceKey.setAttribute('data-key', 'Backspace');
        backspaceKey.setAttribute('type', 'button');
        backspaceKey.setAttribute('aria-label', 'Backspace');
        backspaceKey.addEventListener('click', () => {
            this.onVirtualKeyPress('Backspace');
        });
        
        // Space key
        const spaceKey = document.createElement('button');
        spaceKey.className = 'keyboard-key space-key';
        spaceKey.textContent = ' ';
        spaceKey.setAttribute('data-key', ' ');
        spaceKey.setAttribute('type', 'button');
        spaceKey.setAttribute('aria-label', 'Space');
        spaceKey.addEventListener('click', () => {
            this.onVirtualKeyPress(' ');
        });
        
        // Done key
        const doneKey = document.createElement('button');
        doneKey.className = 'keyboard-key wide-key';
        doneKey.textContent = 'Done';
        doneKey.setAttribute('data-key', 'Done');
        doneKey.setAttribute('type', 'button');
        doneKey.setAttribute('aria-label', 'Done');
        doneKey.addEventListener('click', () => {
            this.hideVirtualKeyboard();
        });
        
        utilityRow.appendChild(backspaceKey);
        utilityRow.appendChild(spaceKey);
        utilityRow.appendChild(doneKey);
        
        virtualKeyboard.appendChild(utilityRow);
    },
    
    // Handle virtual key press
    onVirtualKeyPress(key) {
        // Find the currently focused letter box
        const focusedElement = document.activeElement;
        
        if (focusedElement && focusedElement.classList.contains('letter-box')) {
            if (key === 'Backspace') {
                // Simulate backspace key
                focusedElement.value = '';
                
                // Trigger input event to update UI
                const event = new Event('input', { bubbles: true });
                focusedElement.dispatchEvent(event);
                
                // Move focus to previous box if exists
                const prevBox = focusedElement.previousElementSibling;
                if (prevBox && prevBox.classList.contains('letter-box')) {
                    prevBox.focus();
                }
            } else if (key === ' ') {
                // Space means empty letter box
                focusedElement.value = '';
                
                // Trigger input event to update UI
                const event = new Event('input', { bubbles: true });
                focusedElement.dispatchEvent(event);
                
                // Move focus to next box if exists
                const nextBox = focusedElement.nextElementSibling;
                if (nextBox && nextBox.classList.contains('letter-box')) {
                    nextBox.focus();
                }
            } else {
                // Regular letter key
                focusedElement.value = key.toUpperCase();
                
                // Trigger input event to update UI
                const event = new Event('input', { bubbles: true });
                focusedElement.dispatchEvent(event);
                
                // Move focus to next box if exists
                const nextBox = focusedElement.nextElementSibling;
                if (nextBox && nextBox.classList.contains('letter-box')) {
                    nextBox.focus();
                }
            }
        }
    },
    
    // Show virtual keyboard
    showVirtualKeyboard() {
        let virtualKeyboard = document.getElementById('virtual-keyboard');
        
        if (!virtualKeyboard) {
            // Create keyboard container
            virtualKeyboard = document.createElement('div');
            virtualKeyboard.id = 'virtual-keyboard';
            virtualKeyboard.className = 'virtual-keyboard';
            document.body.appendChild(virtualKeyboard);
            
            // Create keyboard layout
            this.updateVirtualKeyboard();
        }
        
        virtualKeyboard.classList.add('active');
    },
    
    // Hide virtual keyboard
    hideVirtualKeyboard() {
        const virtualKeyboard = document.getElementById('virtual-keyboard');
        if (virtualKeyboard) {
            virtualKeyboard.classList.remove('active');
        }
    }
};

// Initialize language system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Set up language button event listeners immediately
    const langEn = document.getElementById('lang-en');
    const langEs = document.getElementById('lang-es');
    const langFr = document.getElementById('lang-fr');

    if (langEn) {
        langEn.addEventListener('click', function() {
            LanguageManager.changeLanguage('en');
            if (typeof switchDictionary === 'function') {
                switchDictionary('en');
            }
        });
    }
    
    if (langEs) {
        langEs.addEventListener('click', function() {
            LanguageManager.changeLanguage('es');
            if (typeof switchDictionary === 'function') {
                switchDictionary('es');
            }
        });
    }
    
    if (langFr) {
        langFr.addEventListener('click', function() {
            LanguageManager.changeLanguage('fr');
            if (typeof switchDictionary === 'function') {
                switchDictionary('fr');
            }
        });
    }
    
    // Initialize after a short delay to ensure other scripts have loaded
    setTimeout(() => {
        LanguageManager.init();
    }, 100);
    
    // Setup mobile keyboard
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        // Add keyboard toggle button handler
        const keyboardToggle = document.getElementById('keyboard-toggle');
        if (keyboardToggle) {
            keyboardToggle.addEventListener('click', function() {
                const virtualKeyboard = document.getElementById('virtual-keyboard');
                if (virtualKeyboard && virtualKeyboard.classList.contains('active')) {
                    LanguageManager.hideVirtualKeyboard();
                } else {
                    LanguageManager.showVirtualKeyboard();
                }
            });
            
            // Show the keyboard button only on touch devices
            keyboardToggle.style.display = 'block';
        }
        
        // Close keyboard when clicking outside of keyboard and input
        document.addEventListener('click', (e) => {
            if (!e.target.classList.contains('letter-box') && 
                !e.target.closest('#virtual-keyboard') &&
                e.target.id !== 'keyboard-toggle') {
                LanguageManager.hideVirtualKeyboard();
            }
        });
    } else {
        // Hide keyboard toggle on non-touch devices
        const keyboardToggle = document.getElementById('keyboard-toggle');
        if (keyboardToggle) {
            keyboardToggle.style.display = 'none';
        }
    }
});

// Function to update the application text when dictionary changes
function updateDictionary() {
    // Update any UI elements that need to change when dictionary changes
    const resultsElement = document.getElementById('results');
    if (resultsElement) {
        // Clear results when dictionary changes
        resultsElement.innerHTML = '';
    }
}
