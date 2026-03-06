/*
 * Benchmark: BigInt solver vs Uint32Array solver
 * Run with: node benchmark.js
 */

const fs = require('fs');
const path = require('path');

// ── Original BigInt-based solver ────────────────────────────────────────────
class BigIntSolver {
    constructor(words) {
        this.wordsByLength = {};
        this.masks = {};
        this.blocksCount = {};
        this.preprocess(words);
    }

    preprocess(words) {
        for (const word of words) {
            const length = word.length;
            if (!this.wordsByLength[length]) this.wordsByLength[length] = [];
            this.wordsByLength[length].push(word);
        }
        for (const length in this.wordsByLength) {
            const wordsForLength = this.wordsByLength[length];
            const wordCount = wordsForLength.length;
            const nblocks = Math.floor((wordCount + 63) / 64);
            this.blocksCount[length] = nblocks;
            this.masks[length] = {};
            for (let pos = 0; pos < length; pos++) {
                for (const letter of "abcdefghijklmnopqrstuvwxyz") {
                    this.masks[length][`${pos},${letter}`] = new Array(nblocks).fill(0n);
                }
            }
            for (let index = 0; index < wordCount; index++) {
                const word = wordsForLength[index];
                const block = Math.floor(index / 64);
                const bitOffset = index % 64;
                for (let pos = 0; pos < word.length; pos++) {
                    const letter = word[pos].toLowerCase();
                    this.masks[length][`${pos},${letter}`][block] |= 1n << BigInt(bitOffset);
                }
            }
        }
    }

    query(pattern, wildcard = '.') {
        const length = pattern.length;
        if (!this.wordsByLength[length]) return [];
        const words = this.wordsByLength[length];
        const nblocks = this.blocksCount[length];
        const resultMask = new Array(nblocks).fill(0n);
        for (let i = 0; i < nblocks; i++) resultMask[i] = ~0n;
        const extra = nblocks * 64 - words.length;
        if (extra > 0) resultMask[nblocks - 1] &= (~0n) >> BigInt(extra);
        for (let pos = 0; pos < length; pos++) {
            const letter = pattern[pos];
            if (letter === wildcard) continue;
            const lowerLetter = letter.toLowerCase();
            const letterMask = this.masks[length][`${pos},${lowerLetter}`];
            for (let i = 0; i < nblocks; i++) resultMask[i] &= letterMask[i];
        }
        const matches = [];
        for (let block = 0; block < nblocks; block++) {
            let mask = resultMask[block];
            while (mask !== 0n) {
                const bitIndex = this.trailingZeroCount(mask);
                const wordIndex = block * 64 + Number(bitIndex);
                if (wordIndex < words.length) matches.push(words[wordIndex]);
                mask &= mask - 1n;
            }
        }
        return matches;
    }

    trailingZeroCount(n) {
        if (n === 0n) return 64;
        let count = 0n;
        while ((n & 1n) === 0n) { count++; n >>= 1n; }
        return count;
    }
}

// ── Optimized Uint32Array solver ────────────────────────────────────────────
class Uint32Solver {
    constructor(words) {
        this.wordsByLength = {};
        this._data = {};
        this._preprocess(words);
    }

    _preprocess(words) {
        for (const word of words) {
            const len = word.length;
            if (!this.wordsByLength[len]) this.wordsByLength[len] = [];
            this.wordsByLength[len].push(word);
        }
        for (const len in this.wordsByLength) {
            const wordsForLen = this.wordsByLength[len];
            const wordCount = wordsForLen.length;
            const intsPerMask = (wordCount + 31) >>> 5;
            const flatMasks = new Uint32Array(len * 26 * intsPerMask);
            for (let idx = 0; idx < wordCount; idx++) {
                const word = wordsForLen[idx];
                const intIndex = idx >>> 5;
                const bitMask = 1 << (idx & 31);
                for (let pos = 0; pos < word.length; pos++) {
                    const charOffset = word.charCodeAt(pos) - 97;
                    flatMasks[(pos * 26 + charOffset) * intsPerMask + intIndex] |= bitMask;
                }
            }
            this._data[len] = { intsPerMask, flatMasks, wordCount };
        }
    }

    query(pattern, wildcard = '.') {
        const len = pattern.length;
        if (!this.wordsByLength[len]) return [];
        const words = this.wordsByLength[len];
        const { intsPerMask, flatMasks, wordCount } = this._data[len];
        const constraints = [];
        for (let pos = 0; pos < len; pos++) {
            const ch = pattern[pos];
            if (ch !== wildcard) {
                const charOffset = ch.toLowerCase().charCodeAt(0) - 97;
                constraints.push((pos * 26 + charOffset) * intsPerMask);
            }
        }
        if (constraints.length === 0) return words.slice();
        const matches = [];
        const constraintCount = constraints.length;
        const c0 = constraints[0];
        for (let i = 0; i < intsPerMask; i++) {
            let result = flatMasks[c0 + i];
            for (let c = 1; c < constraintCount; c++) {
                result &= flatMasks[constraints[c] + i];
            }
            while (result !== 0) {
                const bit = result & (-result);
                const bitIndex = 31 - Math.clz32(bit);
                const wordIndex = (i << 5) + bitIndex;
                if (wordIndex < wordCount) matches.push(words[wordIndex]);
                result = (result & (result - 1)) | 0;
            }
        }
        return matches;
    }
}

// ── Benchmark runner ────────────────────────────────────────────────────────

// Load dictionary
const dictPath = path.join(__dirname, 'dictionaries', 'en.txt');
if (!fs.existsSync(dictPath)) {
    // Fallback: try the words.txt in the parent crossword-solver dir
    const altPath = path.join(__dirname, '..', 'crossword-solver', 'words.txt');
    if (!fs.existsSync(altPath)) {
        console.error('No dictionary found. Place en.txt in dictionaries/ or words.txt nearby.');
        process.exit(1);
    }
    var words = fs.readFileSync(altPath, 'utf8').split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]+$/.test(w));
} else {
    var words = fs.readFileSync(dictPath, 'utf8').split(/\r?\n/).map(w => w.trim().toLowerCase()).filter(w => /^[a-z]+$/.test(w));
}

console.log(`Dictionary: ${words.length.toLocaleString()} words\n`);

// Test patterns covering different word lengths and constraint counts
const patterns = [
    'a.ple',       // 5-letter, 3 constraints
    '..ing',       // 5-letter, 3 constraints (common suffix)
    'c.t',         // 3-letter, 2 constraints
    '..a..',       // 5-letter, 1 constraint
    'b....d',      // 6-letter, 2 constraints
    's.r..g',      // 6-letter, 3 constraints
    'un....',      // 6-letter, 2 constraints (prefix)
    'p.zz..',      // 6-letter, 3 constraints
];

const WARMUP = 10;
const ITERATIONS = 100;

// Build solvers (time construction too)
console.log('Building solvers...');

let t0 = performance.now();
const bigintSolver = new BigIntSolver(words);
const bigintBuildMs = performance.now() - t0;

t0 = performance.now();
const uint32Solver = new Uint32Solver(words);
const uint32BuildMs = performance.now() - t0;

console.log(`  BigInt build:  ${bigintBuildMs.toFixed(1)} ms`);
console.log(`  Uint32 build:  ${uint32BuildMs.toFixed(1)} ms`);
console.log(`  Build speedup: ${(bigintBuildMs / uint32BuildMs).toFixed(1)}x\n`);

// Verify correctness
console.log('Verifying correctness...');
let allCorrect = true;
for (const pattern of patterns) {
    const a = bigintSolver.query(pattern).sort();
    const b = uint32Solver.query(pattern).sort();
    if (a.length !== b.length || !a.every((v, i) => v === b[i])) {
        console.log(`  MISMATCH on "${pattern}": BigInt=${a.length}, Uint32=${b.length}`);
        allCorrect = false;
    }
}
console.log(allCorrect ? '  ✅ All patterns produce identical results\n' : '  ❌ Mismatches found!\n');

// Benchmark queries
console.log(`Benchmarking ${ITERATIONS} iterations per pattern (${WARMUP} warmup)...\n`);
console.log('Pattern'.padEnd(14) + 'Matches'.padStart(8) + 'BigInt(ms)'.padStart(12) + 'Uint32(ms)'.padStart(12) + 'Speedup'.padStart(10));
console.log('-'.repeat(56));

let totalBigint = 0;
let totalUint32 = 0;

for (const pattern of patterns) {
    // Warmup
    for (let i = 0; i < WARMUP; i++) { bigintSolver.query(pattern); uint32Solver.query(pattern); }

    // BigInt
    const t1 = performance.now();
    let matchCount = 0;
    for (let i = 0; i < ITERATIONS; i++) { matchCount = bigintSolver.query(pattern).length; }
    const bigintMs = performance.now() - t1;

    // Uint32
    const t2 = performance.now();
    for (let i = 0; i < ITERATIONS; i++) { uint32Solver.query(pattern); }
    const uint32Ms = performance.now() - t2;

    totalBigint += bigintMs;
    totalUint32 += uint32Ms;

    const speedup = bigintMs / uint32Ms;
    console.log(
        pattern.padEnd(14) +
        String(matchCount).padStart(8) +
        bigintMs.toFixed(2).padStart(12) +
        uint32Ms.toFixed(2).padStart(12) +
        `${speedup.toFixed(1)}x`.padStart(10)
    );
}

console.log('-'.repeat(56));
console.log(
    'TOTAL'.padEnd(14) +
    ''.padStart(8) +
    totalBigint.toFixed(2).padStart(12) +
    totalUint32.toFixed(2).padStart(12) +
    `${(totalBigint / totalUint32).toFixed(1)}x`.padStart(10)
);
