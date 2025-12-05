import { solveDebts } from './src/logic/settle.js';

// Mock the nets object based on user example
// A: +34, B: -26, C: -2, D: -6
const nets = {
    'A': 34.00,
    'B': -26.00,
    'C': -2.00,
    'D': -6.00
};

console.log("Input Nets:", nets);

const transactions = solveDebts(nets);

console.log("\nCalculated Transactions:");
transactions.forEach(t => {
    console.log(`${t.from} pays ${t.to} £${t.amount}`);
});

// Expected:
// B -> A £26
// D -> A £6
// C -> A £2
