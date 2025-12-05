import { ArrowRight, Check, CheckCircle2, X } from 'lucide-react';
import { useMemo } from 'react';
import { solveDebts } from '../logic/settle';
import { useAppStore } from '../store/AppStore';

const Settle = ({ onBack, nets }) => {
    const { currentProfile, actions } = useAppStore();

    const transactions = useMemo(() => {
        return solveDebts(nets);
    }, [nets]);

    const handleSettleTransaction = (fromId, toId, amount) => {
        // Create a receipt where 'from' pays 'to' the amount
        // This effectively cancels out the debt
        actions.addReceipt(amount, fromId, [toId], null, 'Settlement');
    };

    const getMemberName = (id) => currentProfile.members.find(m => m.id === id)?.name || 'Unknown';

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <h2 className="font-bold text-2xl">Settle Up</h2>
                <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {transactions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted opacity-60">
                        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6">
                            <CheckCircle2 size={40} className="text-success" />
                        </div>
                        <p className="text-lg font-medium">All settled up!</p>
                        <p className="text-sm">No pending debts in this group.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <p className="text-sm text-muted uppercase tracking-wider font-semibold mb-4 ml-1">Suggested Payments</p>
                        {transactions.map((t, idx) => (
                            <div key={idx} className="glass-panel p-5 flex flex-col gap-4 group hover:border-primary/30 transition-colors">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg text-white">{getMemberName(t.from)}</span>
                                            <span className="text-xs text-muted">pays</span>
                                        </div>
                                        <div className="h-px w-8 bg-white/20 relative">
                                            <ArrowRight size={14} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-muted" />
                                        </div>
                                        <div className="flex flex-col items-center">
                                            <span className="font-bold text-lg text-white">{getMemberName(t.to)}</span>
                                            <span className="text-xs text-muted">receives</span>
                                        </div>
                                    </div>
                                    <span className="text-2xl font-bold text-primary font-mono">£{t.amount.toFixed(2)}</span>
                                </div>

                                <button
                                    onClick={() => handleSettleTransaction(t.from, t.to, t.amount)}
                                    className="w-full py-3 rounded-xl bg-primary/10 hover:bg-primary hover:text-black text-primary font-semibold transition-all flex items-center justify-center gap-2 group-hover:shadow-glow"
                                >
                                    <Check size={18} /> Mark as Paid
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Settle;
