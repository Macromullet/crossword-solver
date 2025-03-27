# Crossword Solver

A fast, browser-based crossword puzzle word finder that helps you discover words matching a specific pattern.

## Usage

1. Access the application through a web browser (open `index.html` or serve via a local web server)
2. Enter the desired word size (between 2-15 letters)
3. Click "Generate Boxes"
4. Type letters in the boxes where you know them, leave unknown positions blank
5. Matching words will appear instantly as you type
6. Click on any matching word to fill it into the boxes

## Technical Implementation

This application uses a highly optimized bit-manipulation algorithm to provide instant search results as you type. Originally written in C# and converted to JavaScript, the solver preprocesses the dictionary to enable extremely fast pattern matching.

### Core Algorithm

The crossword solver uses a sophisticated bit-masking technique that revolutionizes how pattern matching is performed:

1. **Dictionary Preprocessing**:
   - Words are first grouped by their length
   - For each word length and each possible (position, letter) combination, a bit mask is created
   - Each bit in the mask corresponds to a specific word in the dictionary
   - If a word has a particular letter at a specific position, its corresponding bit is set to 1

2. **BigInt Implementation**:
   - The solver leverages JavaScript's BigInt to handle 64-bit integer operations efficiently
   - Words are grouped into blocks of 64, with each block represented by a single 64-bit integer
   - This approach drastically reduces memory usage and computation time

3. **Query Processing**:
   - For a given pattern (e.g., "a..le" for "apple"), the algorithm:
     - Starts with all bits set to 1 (representing all words as candidates)
     - For each known letter position, performs a bitwise AND with its corresponding mask
     - After processing all known positions, the remaining 1 bits represent matching words
   - Uses fast bit manipulation (trailing zero count) to identify matching words

4. **Performance Characteristics**:
   - Time Complexity: O(k) where k is the number of known letters in the pattern
   - Space Complexity: O(n × a × p) where n is dictionary size, a is alphabet size, p is max word length
   - Pattern matching is constant time regardless of dictionary size

### System Architecture

The application consists of three main components:

1. **User Interface Layer**:
   - HTML/CSS for rendering the interface
   - JavaScript event handlers for real-time interaction
   - Reactive results display that updates as the user types

2. **Pattern Matcher**:
   - Converts UI input to the appropriate query pattern
   - Handles special cases and input validation
   - Manages the communication between UI and solver

3. **Fast Solver Engine**:
   - The core FastCrosswordSolver class that implements the bit-manipulation algorithm
   - Dictionary loading and preprocessing logic
   - Fallback mechanisms for handling network failures

The application first loads and preprocesses the dictionary, then provides an interactive interface for users to find words matching their specified patterns.

## License

This project is licensed under the MIT License - see the [LICENSE.md](../LICENSE.md) file for details.