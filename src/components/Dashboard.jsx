import { ArrowDownLeft, ArrowRight, ArrowUpRight, Check, ChevronRight, Copy, Edit2, LogOut, Plus, RefreshCw, Users, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';
import AddReceipt from './AddReceipt';
import MemberGallery from './MemberGallery';
import Settle from './Settle';

const Dashboard = () => {
    const { state, currentProfile, dispatch, actions } = useAppStore();
    const [view, setView] = useState('dashboard'); // dashboard, add-receipt, settle, add-member, member-gallery
    const [selectedMemberForGallery, setSelectedMemberForGallery] = useState(null);
    const [newMemberName, setNewMemberName] = useState('');
    const [isEditingId, setIsEditingId] = useState(false);
    const [newPublicId, setNewPublicId] = useState('');
    const [editError, setEditError] = useState('');
    const [copied, setCopied] = useState(false);

    const handleUpdateId = async () => {
        if (newPublicId && newPublicId !== currentProfile.public_id) {
            const success = await actions.updateGroupId(newPublicId);
            if (success) {
                setIsEditingId(false);
                setEditError('');
            } else {
                setEditError('Failed to update ID (might be taken)');
            }
        } else {
            setIsEditingId(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(currentProfile.public_id);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        if (currentProfile?.id) {
            actions.fetchBalances();
            actions.fetchSettlements();
        }
    }, [currentProfile?.id]);

    const nets = state.balances || {};

    const memberTotals = useMemo(() => {
        if (!currentProfile) return {};
        const totals = {};
        currentProfile.members.forEach(m => totals[m.id] = 0);
        currentProfile.receipts.forEach(r => {
            const payerId = r.payer_id || r.payer;
            if (totals[payerId] !== undefined) {
                totals[payerId] += parseFloat(r.total);
            }
        });
        return totals;
    }, [currentProfile]);



    const settlements = state.settlements || [];

    const handleAddMember = (e) => {
        e.preventDefault();
        if (newMemberName.trim()) {
            actions.addMember(newMemberName);
            setNewMemberName('');
            setView('dashboard');
        }
    };

    if (view === 'add-receipt') {
        return (
            <div className="h-full flex flex-col animate-fade-in">
                <div className="flex-none p-4 md:p-6">
                    <button onClick={() => setView('dashboard')} className="btn-secondary text-sm flex items-center gap-2">
                        <ArrowDownLeft className="rotate-45" size={16} /> Back to Dashboard
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="max-w-2xl mx-auto">
                        <AddReceipt onBack={() => setView('dashboard')} />
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'settle') {
        return (
            <div className="h-full flex flex-col animate-fade-in">
                <div className="flex-none p-4 md:p-6">
                    <button onClick={() => setView('dashboard')} className="btn-secondary text-sm flex items-center gap-2">
                        <ArrowDownLeft className="rotate-45" size={16} /> Back to Dashboard
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div className="max-w-2xl mx-auto">
                        <Settle onBack={() => setView('dashboard')} settlements={settlements} />
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'member-gallery' && selectedMemberForGallery) {
        return (
            <MemberGallery
                memberId={selectedMemberForGallery}
                currentProfile={currentProfile}
                onBack={() => setView('dashboard')}
            />
        );
    }

    return (
        <div className="h-full flex flex-col animate-fade-in">
            {/* Header */}
            <header className="flex-none p-4 md:p-6 glass-panel m-4 md:m-6 mb-0 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-20">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">{currentProfile.name}</h1>
                    <div className="flex items-center gap-3 text-sm text-muted">
                        <div className="flex items-center gap-2 bg-surface/50 px-3 py-1 rounded-full border border-white/5">
                            <span className="text-xs uppercase tracking-wider font-semibold">ID</span>
                            {isEditingId ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        className="bg-transparent border-b border-primary outline-none w-32 text-white font-mono"
                                        value={newPublicId}
                                        onChange={e => setNewPublicId(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleUpdateId} className="text-primary hover:text-primary-dim"><Check size={14} /></button>
                                    <button onClick={() => setIsEditingId(false)} className="text-danger hover:text-danger/80"><X size={14} /></button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group cursor-pointer" onClick={copyToClipboard} title="Click to copy">
                                    <span className="font-mono tracking-wider text-white">{currentProfile.public_id}</span>
                                    {copied ? <Check size={12} className="text-success" /> : <Copy size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />}
                                </div>
                            )}
                        </div>

                        {!isEditingId && state.is_admin && (
                            <button
                                onClick={() => { setIsEditingId(true); setNewPublicId(currentProfile.public_id); }}
                                className="p-1 hover:bg-white/10 rounded-full transition-colors"
                                title="Edit Group ID"
                            >
                                <Edit2 size={14} />
                            </button>
                        )}
                        {editError && <span className="text-danger text-xs">{editError}</span>}
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-auto">
                    <button onClick={actions.refreshProfile} className="p-2 hover:bg-white/10 rounded-full transition-colors" title="Refresh">
                        <RefreshCw size={20} className={state.isLoading ? 'animate-spin text-primary' : 'text-muted'} />
                    </button>
                    <button onClick={() => window.location.reload()} className="p-2 hover:bg-danger/10 text-muted hover:text-danger rounded-full transition-colors" title="Logout">
                        <LogOut size={20} />
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* Left Column: Balances & Members */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        {/* Balances Card */}
                        <div className="glass-panel p-5 flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Users size={18} className="text-primary" />
                                    <h2 className="text-lg font-semibold">Balances</h2>
                                </div>
                                <button
                                    onClick={() => setView('settle')}
                                    className="text-xs font-semibold bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary hover:text-black transition-all"
                                >
                                    Settle Up
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {currentProfile.members.map(member => {
                                    const net = nets[member.id] || 0;
                                    const isPositive = net > 0;
                                    const isNegative = net < 0;

                                    return (
                                        <div key={member.id} className="p-3 rounded-xl bg-surface/50 border border-white/5 flex items-center justify-between group hover:bg-surface transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${isPositive ? 'bg-success/20 text-success' : isNegative ? 'bg-danger/20 text-danger' : 'bg-white/10 text-muted'}`}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="font-medium">{member.name}</span>
                                            </div>
                                            <div className={`flex items-center gap-1 font-mono font-bold ${isPositive ? 'text-success' : isNegative ? 'text-danger' : 'text-muted'}`}>
                                                {isPositive && <ArrowUpRight size={16} />}
                                                {isNegative && <ArrowDownLeft size={16} />}
                                                <span>{net === 0 ? '-' : `£${Math.abs(net).toFixed(2)}`}</span>
                                            </div>
                                        </div>
                                    );
                                })}

                                {view === 'add-member' ? (
                                    <form onSubmit={handleAddMember} className="p-3 rounded-xl bg-surface/50 border border-primary/30 flex gap-2 animate-fade-in">
                                        <input
                                            autoFocus
                                            type="text"
                                            placeholder="New Member Name"
                                            className="bg-transparent border-none outline-none text-white w-full text-sm"
                                            value={newMemberName}
                                            onChange={e => setNewMemberName(e.target.value)}
                                        />
                                        <button type="submit" className="text-primary font-bold text-sm">Add</button>
                                        <button type="button" onClick={() => setView('dashboard')} className="text-muted hover:text-white"><X size={16} /></button>
                                    </form>
                                ) : (
                                    <button
                                        onClick={() => setView('add-member')}
                                        className="w-full p-3 rounded-xl border border-dashed border-white/10 text-muted text-sm hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={16} /> Add Member
                                    </button>
                                )}
                            </div>
                        </div>
                        {/* Settlements Section */}
                        <div className="glass-panel p-5 flex flex-col">
                            <div className="flex items-center gap-2 mb-4">
                                <Check size={18} className="text-primary" />
                                <h2 className="text-lg font-semibold">Settlements</h2>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto custom-scrollbar">
                                {settlements.length === 0 ? (
                                    <p className="text-muted text-sm text-center py-4">All settled up!</p>
                                ) : (
                                    settlements.map((t, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-white/5">
                                            <div className="flex items-center gap-2 text-sm">
                                                <span className="font-bold text-white">{currentProfile.members.find(m => m.id === t.from)?.name}</span>
                                                <ArrowRight size={14} className="text-muted" />
                                                <span className="font-bold text-white">{currentProfile.members.find(m => m.id === t.to)?.name}</span>
                                            </div>
                                            <span className="font-mono font-bold text-primary">£{t.amount.toFixed(2)}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Amount Spent Summary */}
                    <div className="lg:col-span-7 flex flex-col h-full min-h-[400px]">
                        <div className="glass-panel p-5 flex-1 flex flex-col relative overflow-hidden">
                            <div className="flex items-center gap-2 mb-6 z-10">
                                <Wallet size={18} className="text-accent" />
                                <h2 className="text-lg font-semibold">Amount Spent</h2>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar z-10 pb-20">
                                {currentProfile.members.map(member => {
                                    const total = memberTotals[member.id] || 0;
                                    return (
                                        <button
                                            key={member.id}
                                            onClick={() => { setSelectedMemberForGallery(member.id); setView('member-gallery'); }}
                                            className="w-full p-4 rounded-xl bg-surface/50 border border-white/5 flex items-center justify-between hover:bg-surface transition-all group hover:border-accent/30 hover:shadow-glow text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-lg font-bold text-muted group-hover:text-white transition-colors border border-white/5">
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <span className="block font-semibold text-lg text-white group-hover:text-accent transition-colors">{member.name}</span>
                                                    <span className="text-sm text-muted">Click for details</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-2xl font-bold font-mono text-white">£{total.toFixed(2)}</span>
                                                <ChevronRight size={20} className="text-muted group-hover:text-accent transition-colors" />
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Floating Add Button (Desktop: Bottom Right of this panel, Mobile: Fixed) */}
                            <div className="absolute bottom-6 right-6 z-20">
                                <button
                                    onClick={() => setView('add-receipt')}
                                    className="h-14 px-6 rounded-full bg-primary text-black font-bold shadow-glow flex items-center gap-2 hover:scale-105 transition-transform"
                                >
                                    <Plus size={24} />
                                    <span className="hidden md:inline">Add Expense</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;

