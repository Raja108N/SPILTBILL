// Core settlement logic

export const calculateNets = (receipts, members) => {
    const nets = {};
    members.forEach(m => nets[m.id] = 0);

    receipts.forEach(receipt => {
        const { payerId, total, split } = receipt;

        // Payer gets credit for the full amount paid
        if (nets[payerId] !== undefined) {
            nets[payerId] += parseFloat(total);
        }

        // Subtract share from each participant
        // split is array of { memberId, weight } or just memberIds if equal
        // Assuming equal split for MVP first, or weighted if provided

        let totalWeight = 0;
        const participants = [];

        if (Array.isArray(split)) {
            // Check if it's simple list of IDs or objects with weights
            if (typeof split[0] === 'string') {
                // Equal split among these IDs
                split.forEach(id => {
                    participants.push({ id, weight: 1 });
                    totalWeight += 1;
                });
            } else {
                // Weighted
                split.forEach(p => {
                    participants.push(p);
                    totalWeight += p.weight || 1;
                });
            }
        }

        if (totalWeight > 0) {
            participants.forEach(p => {
                const share = (parseFloat(total) * (p.weight || 1)) / totalWeight;
                if (nets[p.id] !== undefined) {
                    nets[p.id] -= share;
                }
            });
        }
    });

    return nets;
};

export const solveDebts = (nets) => {
    const debtors = [];
    const creditors = [];

    Object.entries(nets).forEach(([id, amount]) => {
        // Round to 2 decimals to avoid floating point issues
        const val = Math.round(amount * 100) / 100;
        if (val < -0.01) debtors.push({ id, amount: val });
        if (val > 0.01) creditors.push({ id, amount: val });
    });

    // Sort by magnitude (descending) to optimize greedy approach
    debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
    creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

    const transactions = [];

    let i = 0; // debtor index
    let j = 0; // creditor index

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        // The amount to settle is the minimum of the debt or the credit
        const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

        // Round to 2 decimals
        const amountFixed = Math.round(amount * 100) / 100;

        if (amountFixed > 0) {
            transactions.push({
                from: debtor.id,
                to: creditor.id,
                amount: amountFixed
            });
        }

        // Adjust remaining amounts
        debtor.amount += amountFixed;
        creditor.amount -= amountFixed;

        // Check if settled (using small epsilon for float safety)
        if (Math.abs(debtor.amount) < 0.01) i++;
        if (Math.abs(creditor.amount) < 0.01) j++;
    }

    return transactions;
};
