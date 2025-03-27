document.addEventListener('DOMContentLoaded', function() {
    const wordSizeInput = document.getElementById('word-size');
    const generateBtn = document.getElementById('generate-btn');
    const wordInputContainer = document.getElementById('word-input');
    const resultsContainer = document.getElementById('results');
    
    let letterBoxes = [];
    
    // Generate input boxes based on word size
    generateBtn.addEventListener('click', function() {
        const wordSize = parseInt(wordSizeInput.value);
        if (wordSize < 2 || wordSize > 15) {
            alert('Please enter a word size between 2 and 15');
            return;
        }
        
        generateLetterBoxes(wordSize);
    });
    
    function generateLetterBoxes(size) {
        // Clear previous boxes and results
        wordInputContainer.innerHTML = '';
        resultsContainer.innerHTML = '';
        letterBoxes = [];
        
        // Create new letter boxes
        for (let i = 0; i < size; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.maxLength = 1;
            input.className = 'letter-box';
            input.dataset.index = i;
            
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
            
            // Allow backspace to go to previous box
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value) {
                    const prevIndex = parseInt(this.dataset.index) - 1;
                    if (prevIndex >= 0) {
                        letterBoxes[prevIndex].focus();
                    }
                }
            });
            
            letterBoxes.push(input);
            wordInputContainer.appendChild(input);
        }
        
        // Focus on the first box
        if (letterBoxes.length > 0) {
            letterBoxes[0].focus();
        }
    }
    
    function updateResults() {
        resultsContainer.innerHTML = '';
        
        // Exit if solver isn't loaded yet
        if (!solver) {
            resultsContainer.innerHTML = '<div class="loading">Loading dictionary...</div>';
            return;
        }
        
        // Get current pattern
        let pattern = '';
        
        for (const box of letterBoxes) {
            if (box.value) {
                pattern += box.value.toLowerCase();
            } else {
                pattern += '.'; // Use dot as wildcard
            }
        }
        
        // Skip search if no input yet
        if (pattern === '.'.repeat(letterBoxes.length)) {
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
                resultsContainer.appendChild(wordElement);
                
                // Add click behavior to fill in the word
                wordElement.addEventListener('click', function() {
                    for (let i = 0; i < word.length; i++) {
                        letterBoxes[i].value = word[i].toUpperCase();
                    }
                    updateResults();
                });
            });
        }
    }
});
