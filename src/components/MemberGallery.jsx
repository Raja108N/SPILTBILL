import { ArrowLeft, Clock, Receipt } from 'lucide-react';

const MemberGallery = ({ memberId, onBack, currentProfile }) => {
    const member = currentProfile.members.find(m => m.id === memberId);

    // Filter receipts paid by this member
    const memberReceipts = currentProfile.receipts.filter(r =>
        (r.payer_id === memberId || r.payer === memberId)
    ).reverse();

    const totalSpent = memberReceipts.reduce((sum, r) => sum + parseFloat(r.total), 0);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 mb-2">
                <button onClick={onBack} className="btn-secondary text-sm flex items-center gap-2 group px-3 md:px-4">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> <span className="hidden md:inline">Back to Dashboard</span><span className="md:hidden">Back</span>
                </button>
                <div className="text-right">
                    <h2 className="text-2xl font-bold text-gradient">{member?.name}</h2>
                    <p className="text-muted text-sm uppercase tracking-wider font-semibold">Total Spent</p>
                </div>
            </div>

            {/* Total Badge */}
            <div className="px-6 pb-6">
                <div className="glass-panel p-6 flex flex-col items-center justify-center relative overflow-hidden bg-surface shadow-sm">
                    <div className="absolute inset-0 bg-primary/10 blur-3xl rounded-full"></div>
                    <span className="text-5xl font-bold font-mono text-primary relative z-10 text-shadow-glow">£{totalSpent.toFixed(2)}</span>
                    <p className="text-sm text-muted mt-2 relative z-10">{memberReceipts.length} Expenses Recorded</p>
                </div>
            </div>

            {/* Gallery Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
                {memberReceipts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-muted opacity-60">
                        <Receipt size={48} className="mb-4" />
                        <p>No expenses found for {member?.name}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {memberReceipts.map(receipt => (
                            <div key={receipt.id} className="glass-panel group overflow-hidden hover:border-primary/50 transition-all hover:shadow-md bg-surface border-border">
                                {/* Image / Placeholder */}
                                <div className="h-48 bg-surface-hover relative overflow-hidden border-b border-border">
                                    {receipt.image ? (
                                        <img
                                            src={receipt.image.startsWith('http') ? receipt.image : `${import.meta.env.VITE_API_BASE_URL || ''}${receipt.image}`}
                                            alt={receipt.description}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                                            <Receipt size={48} className="text-muted/30 group-hover:text-primary transition-colors" />
                                        </div>
                                    )}
                                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                                        <span className="text-2xl font-bold font-mono text-white">£{parseFloat(receipt.total).toFixed(2)}</span>
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="p-4">
                                    <h3 className="font-bold text-lg mb-1 truncate text-text" title={receipt.description}>{receipt.description || 'Expense'}</h3>
                                    <div className="flex items-center gap-2 text-xs text-muted mb-3">
                                        <Clock size={12} />
                                        <span>{new Date(receipt.created_at).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{new Date(receipt.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>

                                    {/* Split info pill */}
                                    <div className="inline-flex items-center gap-1 bg-surface-hover border border-border rounded-full px-2 py-1 text-xs text-muted">
                                        <span>Split with {receipt.splits?.length || 'all'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MemberGallery;
