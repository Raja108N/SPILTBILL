import { ArrowLeft, Clock, Edit2, Receipt, Trash2, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../store/AppStore';

const MemberGallery = ({ memberId, onBack, currentProfile, onEdit }) => {
    const { actions, currentMemberId } = useAppStore();
    const member = currentProfile.members.find(m => m.id === memberId);
    const [zoomedImage, setZoomedImage] = useState(null);

    // Filter receipts paid by this member
    const memberReceipts = currentProfile.receipts.filter(r =>
        (r.payer_id === memberId || r.payer === memberId)
    ).reverse();

    const totalSpent = memberReceipts.reduce((sum, r) => sum + parseFloat(r.total), 0);

    const handleDelete = async (receiptId, e) => {
        e.stopPropagation();
        if (window.confirm("Are you sure you want to delete this expense?")) {
            await actions.deleteReceipt(receiptId);
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in relative">
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
                        {memberReceipts.map(receipt => {
                            const isOwnReceipt = currentMemberId === (receipt.payer_id || receipt.payer);
                            return (
                                <div key={receipt.id} className="glass-panel group relative overflow-hidden bg-surface border-border hover:border-primary/50 transition-all hover:shadow-md">

                                    {/* Action Buttons (Only for Owner) */}
                                    {isOwnReceipt && (
                                        <div className="absolute top-2 right-2 z-20 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onEdit(receipt); }}
                                                className="p-2 bg-black/50 text-white rounded-full hover:bg-primary transition-colors backdrop-blur-sm"
                                                title="Edit"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(receipt.id, e)}
                                                className="p-2 bg-black/50 text-white rounded-full hover:bg-danger transition-colors backdrop-blur-sm"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    )}

                                    {/* Image / Placeholder */}
                                    <div
                                        className={`h-48 bg-surface-hover relative overflow-hidden border-b border-border ${receipt.image ? 'cursor-zoom-in' : ''}`}
                                        onClick={() => receipt.image && setZoomedImage(receipt.image)}
                                    >
                                        {receipt.image ? (
                                            <>
                                                <img
                                                    src={receipt.image?.replace(/^(?:https?:)?\/\/[^/]+/, '')}
                                                    alt={receipt.description}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                />
                                                {/* Hover Overlay with Zoom Icon */}
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                                    <div className="bg-black/50 text-white p-2 rounded-full backdrop-blur-sm">
                                                        <ZoomIn size={24} />
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-surface-hover">
                                                <Receipt size={48} className="text-muted/30 group-hover:text-primary transition-colors" />
                                            </div>
                                        )}
                                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pointer-events-none">
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
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Lightbox / Zoom Modal */}
            {/* Lightbox / Zoom Modal - Ported to body to escape transform stacking contexts */}
            {zoomedImage && createPortal(
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md animate-fade-in p-4"
                    onClick={() => setZoomedImage(null)}
                >
                    {/* Close Button */}
                    <button
                        onClick={() => setZoomedImage(null)}
                        className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-[110]"
                        title="Close Zoom"
                    >
                        <X size={32} />
                    </button>

                    {/* Image Container */}
                    <div className="relative w-full h-full flex items-center justify-center overflow-hidden" onClick={e => e.stopPropagation()}>
                        <img
                            src={zoomedImage.replace(/^(?:https?:)?\/\/[^/]+/, '')}
                            alt="Zoomed Receipt"
                            className="max-w-full max-h-[90dvh] object-contain shadow-2xl rounded-lg select-none"
                        />
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default MemberGallery;
