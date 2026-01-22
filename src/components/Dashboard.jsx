import { ArrowRight, Banknote, Check, ChevronRight, Copy, Home, LogOut, Plus, RefreshCw, Users, Wallet, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '../store/AppStore';
import AddReceipt from './AddReceipt';
import MemberGallery from './MemberGallery';
import Settle from './Settle';

const Dashboard = () => {
    const { state, currentProfile, dispatch, actions } = useAppStore();
    const [view, setView] = useState('dashboard'); // dashboard, add-receipt, settle, members, member-gallery
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
            actions.refreshProfile();
        }
    }, [currentProfile?.id]);

    const nets = state.balances || {};
    const settlements = state.settlements || [];

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

    const handleAddMember = (e) => {
        e.preventDefault();
        if (newMemberName.trim()) {
            actions.addMember(newMemberName);
            setNewMemberName('');
            // stay on members view
        }
    };

    // --- Sub-Components/Views ---

    const Header = () => (
        <header className="flex-none bg-gradient-to-br from-primary via-purple-600 to-accent text-white p-6 pb-20 md:pb-24 relative overflow-hidden z-0">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/3 pointer-events-none"></div>

            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-black tracking-tight drop-shadow-md">{currentProfile.name}</h1>
                        <div className="flex items-center gap-3 mt-2">
                            {/* ID Badge Pill */}
                            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full shadow-sm hover:bg-white/30 transition-colors">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">ID</span>
                                {isEditingId ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            className="bg-transparent border-b border-white outline-none w-16 text-white font-mono font-bold text-sm"
                                            value={newPublicId}
                                            onChange={e => setNewPublicId(e.target.value)}
                                            autoFocus
                                        />
                                        <button onClick={handleUpdateId}><Check size={12} strokeWidth={3} className="text-white" /></button>
                                        <button onClick={() => setIsEditingId(false)}><X size={12} strokeWidth={3} className="text-white" /></button>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 group/id cursor-pointer" onClick={copyToClipboard}>
                                        <span className="font-mono font-bold text-sm tracking-wide">{currentProfile.public_id}</span>
                                        {copied ? <Check size={12} /> : <Copy size={12} className="opacity-70 group-hover/id:opacity-100" />}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={actions.refreshProfile}
                            className="bg-white/20 hover:bg-white/30 rounded-full p-2.5 backdrop-blur-md transition-all active:scale-95 border border-white/10"
                        >
                            <RefreshCw size={20} className={`text-white ${state.isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={actions.logout}
                            className="bg-white/20 hover:bg-white/30 rounded-full p-2.5 backdrop-blur-md transition-all active:scale-95 border border-white/10"
                        >
                            <LogOut size={20} className="text-white" />
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );

    const BalancesList = () => (
        <div className="space-y-3">
            {currentProfile.members.map(member => {
                const net = nets[member.id] || 0;
                const isPositive = net > 0;
                const isNegative = net < 0;

                return (
                    <div key={member.id} className="p-4 rounded-[20px] bg-white border border-gray-100 flex items-center justify-between group shadow-sm">
                        <div className="flex items-center gap-3">
                            {/* Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600 border border-gray-200 shadow-inner">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-800 text-lg">{member.name}</span>
                        </div>

                        <div className="text-right">
                            <div className={`flex items-center justify-end gap-1 font-mono font-bold text-xl ${isPositive ? 'text-green-600' : isNegative ? 'text-red-500' : 'text-gray-400'}`}>
                                {isPositive && <ArrowRight size={16} className="rotate-180" />}
                                {isNegative && <ArrowRight size={16} />}
                                <span>{net === 0 ? '-' : `£${Math.abs(net).toFixed(2)}`}</span>
                            </div>
                            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide">
                                {isPositive ? "Owed by group" : isNegative ? "Owes the group" : "Settled"}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const MembersView = () => (
        <div className="p-4 space-y-4 pb-32 animate-fade-in pt-6">
            <h2 className="text-xl font-bold mb-4 text-text">Group Members</h2>
            <form onSubmit={handleAddMember} className="p-4 rounded-3xl bg-surface border border-primary/20 flex gap-3 mb-6 shadow-glow">
                <input
                    type="text"
                    placeholder="Add new member..."
                    className="bg-transparent border-none outline-none text-text w-full placeholder-muted/50"
                    value={newMemberName}
                    onChange={e => setNewMemberName(e.target.value)}
                />
                <button type="submit" className="bg-primary text-white rounded-xl p-2 px-4 font-bold text-sm shadow-md">Add</button>
            </form>

            <div className="space-y-3">
                {currentProfile.members.map(member => (
                    <div key={member.id} onClick={() => { setSelectedMemberForGallery(member.id); setView('member-gallery'); }} className="p-4 rounded-3xl bg-surface border border-border flex items-center justify-between active:scale-98 transition-transform shadow-sm">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-hover border border-border flex items-center justify-center text-lg font-bold text-primary">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span className="block font-semibold text-lg text-text">{member.name}</span>
                                <span className="text-sm text-primary font-medium">Spent: £{(memberTotals[member.id] || 0).toFixed(2)}</span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-muted" />
                    </div>
                ))}
            </div>
        </div>
    );

    // --- Main Rendering Logic ---

    // 1. Full Screen Views (Overlays)
    if (view === 'add-receipt') return <AddReceipt onBack={() => setView('dashboard')} />;
    if (view === 'settle') return (
        <Settle
            onBack={() => setView('dashboard')}
            settlements={settlements}
        />
    );
    if (view === 'member-gallery' && selectedMemberForGallery) return (
        <MemberGallery
            memberId={selectedMemberForGallery}
            currentProfile={currentProfile}
            onBack={() => setView('members')}
        />
    );

    // 2. Dashboard View
    return (
        <div className="h-full flex flex-col animate-fade-in bg-gray-50/50 relative">
            {/* Top Full-Width Header */}
            <Header />

            {/* Overlapping Content Area */}
            <div className="flex-1 -mt-10 rounded-t-[32px] bg-gray-50/50 overflow-hidden relative z-10">
                <div className="h-full overflow-y-auto pb-32 px-4 pt-6 custom-scrollbar">

                    {/* Mobile View Switcher within Content Area */}
                    {view === 'members' ? (
                        <MembersView />
                    ) : (
                        // Default Dashboard View
                        <div className="flex flex-col gap-6 max-w-[800px] mx-auto">

                            {/* Balances Section Card */}
                            <div className="bg-white rounded-[28px] p-2 shadow-lg border border-gray-100">
                                <div className="p-4 pb-2 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
                                            <Users size={20} />
                                        </div>
                                        <h2 className="text-lg font-bold text-gray-800">Group Balances</h2>
                                    </div>
                                    <button
                                        onClick={() => setView('settle')}
                                        className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-full border border-purple-100 transition-all flex items-center gap-2"
                                    >
                                        <Banknote size={14} /> Settle Up
                                    </button>
                                </div>

                                <div className="p-2">
                                    <BalancesList />
                                </div>
                            </div>

                            {/* Recent Activity / Spending Summary */}
                            <div className="bg-white rounded-[28px] p-6 shadow-sm border border-gray-100 min-h-[200px]">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><Wallet size={20} /></div>
                                    <h2 className="text-lg font-bold text-gray-800">Spending Summary</h2>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentProfile.members.map(member => (
                                        <div key={member.id} className="p-4 rounded-3xl bg-gray-50 border border-gray-100 flex flex-col gap-1">
                                            <span className="text-gray-500 text-sm font-medium">{member.name}</span>
                                            <span className="text-2xl font-mono text-gray-800">£{(memberTotals[member.id] || 0).toFixed(2)}</span>
                                            <div className="w-full bg-gray-200 h-1.5 rounded-full mt-2 overflow-hidden">
                                                <div className="bg-gradient-to-r from-blue-400 to-purple-500 h-full rounded-full" style={{ width: `${Math.min(((memberTotals[member.id] || 0) / 1000) * 100, 100)}%` }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Desktop FAB (Hidden on Mobile) */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setView('add-receipt')}
                    className="h-16 px-8 rounded-full bg-primary text-white font-extrabold shadow-glow flex items-center gap-3 hover:scale-105 transition-transform text-lg"
                >
                    <Plus size={24} /> Add Expense
                </button>
            </div>

            {/* Mobile Bottom Navigation & FAB */}
            <div className="md:hidden absolute bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-[400px] h-[72px] bg-white rounded-[3rem] shadow-[0_8px_30px_rgba(0,0,0,0.12)] z-50 grid grid-cols-5 items-center px-2 relative">

                {/* Home Button (Spans 2 columns) */}
                <div className="col-span-2 flex justify-center">
                    <button
                        onClick={() => setView('dashboard')}
                        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${view === 'dashboard' ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                    >
                        <Home size={26} className={view === 'dashboard' ? 'stroke-[2.5px] fill-[#8B5CF6]/10' : 'stroke-[2px]'} />
                        <span className="text-[10px] font-bold">Home</span>
                    </button>
                </div>

                {/* FAB Container (Middle Column) */}
                <div className="col-span-1 relative flex justify-center">
                    <button
                        onClick={() => setView('add-receipt')}
                        className="absolute -top-12 w-[72px] h-[72px] rounded-full bg-[#8B5CF6] text-white flex items-center justify-center transition-transform active:scale-95 shadow-[0_10px_25px_rgba(139,92,246,0.6)] ring-[8px] ring-gray-50 md:ring-white"
                    >
                        <Plus size={36} strokeWidth={3} />
                    </button>
                </div>

                {/* Members Button (Spans 2 columns) */}
                <div className="col-span-2 flex justify-center">
                    <button
                        onClick={() => setView('members')}
                        className={`flex flex-col items-center justify-center gap-1 transition-all duration-300 ${view === 'members' ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                    >
                        <Users size={26} className={view === 'members' ? 'stroke-[2.5px] fill-[#8B5CF6]/10' : 'stroke-[2px]'} />
                        <span className="text-[10px] font-bold">Members</span>
                    </button>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;
