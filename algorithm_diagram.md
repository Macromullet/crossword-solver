# Crossword Solver Algorithm Visualization

Below is a visual representation of the bit-masking algorithm used in the Crossword Solver.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 
  'primaryColor': '#e3f2fd', 
  'primaryTextColor': '#37474f', 
  'primaryBorderColor': '#90caf9', 
  'lineColor': '#78909c', 
  'secondaryColor': '#f1f8e9', 
  'tertiaryColor': '#eceff1',
  'fontFamily': 'system-ui, -apple-system, sans-serif'
}}}%%

flowchart TD
    subgraph Preprocessing["Dictionary Preprocessing"]
        A[Load Dictionary] --> B[Group Words by Length]
        B --> C[Create Position-Letter Masks]
        C --> D[Store Bit Arrays in Memory]
    end

    subgraph BitMaskCreation["Bit Mask Creation (For each word length)"]
        E["Create mask for each Position,Letter pair"] --> |Example: 'a' at position 1|F
        F[For each word with matching position-letter] --> G[Set corresponding bit to 1]
        G --> H[Store in mask array for position-letter pair]
    end

    subgraph QueryProcessing["Query Processing"]
        I[User Inputs Pattern] --> J[Extract Known Letters and Positions]
        J --> K[Start with All-Ones Bit Mask]
        K --> L[For each known position-letter]
        L --> M{More known letters?}
        M -- Yes --> N[AND with corresponding bit mask]
        N --> L
        M -- No --> O[Extract Word Indices from Final Mask]
        O --> P[Return Matching Words]
    end

    subgraph BitMaskExample["Simplified Bit Mask Example"]
        dict["Dictionary (5-letter words):
        1: apple
        2: horse
        3: happy
        4: paper"] -.- masks

        masks["Position-Letter Masks:"] -.- mask_a1
        mask_a1["'a' at pos 1:
        [1, 0, 1, 0]
        (apple, happy)"] 
        
        masks -.- mask_p3
        mask_p3["'p' at pos 3:
        [1, 0, 0, 1]
        (apple, paper)"]
        
        masks -.- mask_e5
        mask_e5["'e' at pos 5:
        [1, 1, 0, 0]
        (apple, horse)"]
        
        query["Query: 'a_p_e'"] --> combine
        combine["Bitwise AND:
        [1,0,1,0] & [1,0,0,1] & [1,1,0,0]"] --> result
        result["Final Result:
        [1,0,0,0]
        (apple)"]
    end
    
    Preprocessing -.-> BitMaskCreation
    BitMaskCreation -.-> QueryProcessing
    QueryProcessing -.-> BitMaskExample
```

## Algorithm Explanation

The diagram above illustrates the following key components of the crossword solver algorithm:

1. **Dictionary Preprocessing**
   - The dictionary is loaded and words are grouped by length
   - For each length, position, and letter combination, bit masks are created
   - Each bit in a mask represents a specific word in the dictionary

2. **Bit Mask Creation**
   - For each (position, letter) pair (e.g., 'a' at position 1)
   - Set the corresponding bit to 1 for each word that has that letter at that position
   - Store these bit masks for quick lookup during queries

3. **Query Processing**
   - When a user enters a pattern like "a_p_e"
   - Start with a mask of all 1s (representing all words as potential matches)
   - For each known letter position ('a' at position 1, 'p' at position 3, 'e' at position 5)
   - Perform a bitwise AND with the corresponding mask
   - After processing all known positions, the remaining 1 bits represent matching words

4. **Bit Manipulation Details**
   - Example showing how words like "apple" are represented in the bit masks
   - How combining masks with AND operations filters down to only matching words

This algorithm achieves O(k) time complexity where k is the number of known letters in the pattern, making it extremely efficient regardless of dictionary size.