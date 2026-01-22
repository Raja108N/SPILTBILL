import {
    ArrowDownLeft,
    ArrowUpRight,
    Banknote,
    Check,
    ChevronRight,
    Copy,
    Edit2,
    Home,
    LogOut,
    Plus,
    RefreshCw,
    Users,
    Wallet,
    X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAppStore } from "../store/AppStore";
import AddReceipt from "./AddReceipt";
import MemberGallery from "./MemberGallery";
import Settle from "./Settle";

const Dashboard = () => {
    const { state, currentProfile, dispatch, actions } = useAppStore();
    const [view, setView] = useState("dashboard"); // dashboard, add-receipt, settle, members, member-gallery
    const [selectedMemberForGallery, setSelectedMemberForGallery] = useState(null);
    const [newMemberName, setNewMemberName] = useState("");
    const [isEditingId, setIsEditingId] = useState(false);
    const [newPublicId, setNewPublicId] = useState("");
    const [editError, setEditError] = useState("");
    const [copied, setCopied] = useState(false);

    const handleUpdateId = async () => {
        if (newPublicId && newPublicId !== currentProfile.public_id) {
            const success = await actions.updateGroupId(newPublicId);
            if (success) {
                setIsEditingId(false);
                setEditError("");
            } else {
                setEditError("Failed to update ID (might be taken)");
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
        currentProfile.members.forEach((m) => (totals[m.id] = 0));
        currentProfile.receipts.forEach((r) => {
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
            setNewMemberName("");
            // stay on members view
        }
    };

    // --- Sub-Components/Views ---

    const Header = () => {
        const currentUser = currentProfile.members.find((m) => m.id === state.currentMemberId);

        const formattedDate = new Intl.DateTimeFormat("en-GB", {
            weekday: "short",
            day: "numeric",
            month: "short"
        }).format(new Date());

        return (
            <header className="flex-none pt-4 pb-2 px-4 sm:px-6 sticky top-0 z-30 bg-surface-glass/95 backdrop-blur-xl border-b border-white/20 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all duration-300">
                <div className="flex flex-col gap-3">
                    {/* Top Row */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 ml-1 min-w-0">
                            <span className="text-sm font-medium text-muted min-w-0">
                                Hi,{" "}
                                <span className="text-text font-bold text-base">
                                    {currentUser?.name?.split(" ")[0]}
                                </span>
                            </span>

                            <div className="w-1 h-1 rounded-full bg-border shrink-0"></div>

                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/5 border border-primary/10 shrink-0">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                    {formattedDate}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Row (Responsive) */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        {/* Left: Group Pill */}
                        <div className="flex items-center min-w-0">
                            <div className="relative w-full sm:w-auto bg-gradient-to-br from-white to-white/90 border border-white shadow-[0_2px_12px_rgba(0,0,0,0.04)] px-3 sm:px-4 py-2 rounded-2xl flex items-center gap-3 transition-all hover:shadow-md min-w-0">
                                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-primary shrink-0">
                                    <Home size={16} strokeWidth={2.5} />
                                </div>

                                {/* Fits all sizes: wraps on mobile, normal on desktop */}
                                <h1
                                    className="
                    min-w-0 flex-1
                    text-[15px] sm:text-lg
                    font-black text-gray-900 tracking-tight leading-tight
                    whitespace-normal break-words
                    line-clamp-2 sm:line-clamp-none
                  "
                                    title={currentProfile.name}
                                >
                                    {currentProfile.name}
                                </h1>
                            </div>
                        </div>

                        {/* Right: ID above icons on mobile, row on desktop */}
                        <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-2">
                            {/* ID Badge */}
                            {!isEditingId && (
                                <div
                                    className="
                    w-fit
                    flex flex-col items-start justify-center
                    px-3 py-1.5 rounded-xl
                    bg-white/40 border border-white/20
                    hover:bg-white/60 transition-all cursor-pointer
                    group/id
                  "
                                    onClick={copyToClipboard}
                                >
                                    <span className="text-[9px] uppercase font-bold text-muted/60 leading-none mb-0.5">
                                        ID
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-xs text-text font-bold tracking-wider">
                                            {currentProfile.public_id}
                                        </span>
                                        {copied ? (
                                            <Check size={10} className="text-success" />
                                        ) : (
                                            <Copy
                                                size={10}
                                                className="text-muted opacity-0 group-hover/id:opacity-100 transition-opacity"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions Pill */}
                            {isEditingId ? (
                                <div className="flex items-center gap-1 bg-surface/80 p-1 rounded-full border border-primary/20 animate-scale-in">
                                    <input
                                        className="bg-transparent border-none outline-none w-24 text-xs text-center font-mono"
                                        value={newPublicId}
                                        onChange={(e) => setNewPublicId(e.target.value)}
                                        autoFocus
                                    />
                                    <button
                                        onClick={handleUpdateId}
                                        className="p-1.5 rounded-full bg-primary text-white shadow-sm"
                                    >
                                        <Check size={12} />
                                    </button>
                                    <button
                                        onClick={() => setIsEditingId(false)}
                                        className="p-1.5 rounded-full hover:bg-danger/10 text-danger"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-0.5 bg-white/50 p-1 rounded-full border border-white/30 backdrop-blur-md shadow-sm">
                                    {state.is_admin && (
                                        <button
                                            onClick={() => {
                                                setIsEditingId(true);
                                                setNewPublicId(currentProfile.public_id);
                                            }}
                                            className="p-2 text-muted/70 hover:text-text hover:bg-white rounded-full transition-all"
                                            title="Edit ID"
                                        >
                                            <Edit2 size={16} strokeWidth={2} />
                                        </button>
                                    )}

                                    <button
                                        onClick={actions.refreshProfile}
                                        className="p-2 text-muted/70 hover:text-primary hover:bg-white rounded-full transition-all"
                                        title="Refresh"
                                    >
                                        <RefreshCw
                                            size={16}
                                            strokeWidth={2}
                                            className={state.isLoading ? "animate-spin" : ""}
                                        />
                                    </button>

                                    <div className="w-px h-4 bg-muted/20 mx-0.5"></div>

                                    <button
                                        onClick={actions.logout}
                                        className="p-2 text-muted/70 hover:text-danger hover:bg-white rounded-full transition-all"
                                        title="Logout"
                                    >
                                        <LogOut size={16} strokeWidth={2} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Optional error under header */}
                    {editError ? <div className="text-xs text-danger font-medium px-1">{editError}</div> : null}
                </div>
            </header>
        );
    };

    const BalancesList = () => (
        <div className="space-y-3">
            {currentProfile.members.map((member) => {
                const net = nets[member.id] || 0;
                const isPositive = net > 0;
                const isNegative = net < 0;

                return (
                    <div
                        key={member.id}
                        className="p-4 rounded-3xl bg-surface border border-border flex items-center justify-between group md:hover:bg-surface-hover transition-colors shadow-sm"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-inner ${isPositive
                                        ? "bg-success/10 text-success"
                                        : isNegative
                                            ? "bg-danger/10 text-danger"
                                            : "bg-surface-hover border border-border text-muted"
                                    }`}
                            >
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-lg text-text">{member.name}</span>
                        </div>
                        <div
                            className={`flex items-center gap-1 font-mono font-bold text-lg ${isPositive ? "text-success" : isNegative ? "text-danger" : "text-muted"
                                }`}
                        >
                            {isPositive && <ArrowUpRight size={18} />}
                            {isNegative && <ArrowDownLeft size={18} />}
                            <span>{net === 0 ? "-" : `£${Math.abs(net).toFixed(2)}`}</span>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    const MembersView = () => (
        <div className="p-4 space-y-4 pb-32 animate-fade-in">
            <h2 className="text-xl font-bold mb-4 text-text">Group Members</h2>
            <form
                onSubmit={handleAddMember}
                className="p-4 rounded-3xl bg-surface border border-primary/20 flex gap-3 mb-6 shadow-glow"
            >
                <input
                    type="text"
                    placeholder="Add new member..."
                    className="bg-transparent border-none outline-none text-text w-full placeholder-muted/50"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                />
                <button
                    type="submit"
                    className="bg-primary text-white rounded-xl p-2 px-4 font-bold text-sm shadow-md"
                >
                    Add
                </button>
            </form>

            <div className="space-y-3">
                {currentProfile.members.map((member) => (
                    <div
                        key={member.id}
                        onClick={() => {
                            setSelectedMemberForGallery(member.id);
                            setView("member-gallery");
                        }}
                        className="p-4 rounded-3xl bg-surface border border-border flex items-center justify-between active:scale-98 transition-transform shadow-sm"
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-surface-hover border border-border flex items-center justify-center text-lg font-bold text-primary">
                                {member.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <span className="block font-semibold text-lg text-text">{member.name}</span>
                                <span className="text-sm text-primary font-medium">
                                    Spent: £{(memberTotals[member.id] || 0).toFixed(2)}
                                </span>
                            </div>
                        </div>
                        <ChevronRight size={20} className="text-muted" />
                    </div>
                ))}
            </div>
        </div>
    );

    const [editingReceipt, setEditingReceipt] = useState(null);

    // --- Main Rendering Logic ---

    // 1. Full Screen Views (Overlays)
    if (view === "add-receipt") return <AddReceipt onBack={() => setView("dashboard")} />;
    if (view === "edit-receipt")
        return (
            <AddReceipt
                onBack={() => {
                    setView("members");
                    setEditingReceipt(null);
                }}
                initialData={editingReceipt}
            />
        );

    if (view === "settle")
        return <Settle onBack={() => setView("dashboard")} settlements={settlements} />;

    if (view === "member-gallery" && selectedMemberForGallery)
        return (
            <MemberGallery
                memberId={selectedMemberForGallery}
                currentProfile={currentProfile}
                onBack={() => setView("members")}
                onEdit={(receipt) => {
                    setEditingReceipt(receipt);
                    setView("edit-receipt");
                }}
            />
        );

    // 2. Dashboard View
    return (
        <div className="h-full flex flex-col animate-fade-in md:p-6 max-w-[1200px] mx-auto w-full">
            <Header />

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto pb-28 md:pb-0 px-4 md:px-0 custom-scrollbar">
                {view === "members" ? (
                    <MembersView />
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4 md:mt-0">
                        {/* Balances Section */}
                        <div className="lg:col-span-12 xl:col-span-5">
                            <div className="glass-panel p-5 flex flex-col gap-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-primary/10 rounded-xl text-primary">
                                            <Users size={20} />
                                        </div>
                                        <h2 className="text-lg font-semibold text-text">Balances</h2>
                                    </div>
                                    <button
                                        onClick={() => setView("settle")}
                                        className="text-xs font-bold bg-surface hover:bg-surface-hover text-text px-4 py-2 rounded-full border border-border transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Banknote size={14} className="text-primary" /> Settle Up
                                    </button>
                                </div>

                                <BalancesList />

                                <div className="md:hidden">
                                    <p className="text-center text-xs text-muted">Tap 'Settle Up' to clear debts.</p>
                                </div>
                            </div>
                        </div>

                        {/* Spending Summary */}
                        <div className="lg:col-span-12 xl:col-span-7">
                            <div className="glass-panel p-5 min-h-[300px]">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-accent/10 rounded-xl text-accent">
                                        <Wallet size={20} />
                                    </div>
                                    <h2 className="text-lg font-semibold text-text">Spending Summary</h2>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {currentProfile.members.map((member) => (
                                        <div
                                            key={member.id}
                                            className="p-4 rounded-3xl bg-surface border border-border flex flex-col gap-1 shadow-sm"
                                        >
                                            <span className="text-muted text-sm font-medium">{member.name}</span>
                                            <span className="text-2xl font-mono text-text">
                                                £{(memberTotals[member.id] || 0).toFixed(2)}
                                            </span>
                                            <div className="w-full bg-surface-hover h-2 rounded-full mt-2 overflow-hidden">
                                                <div
                                                    className="bg-gradient-to-r from-accent to-primary h-full rounded-full"
                                                    style={{
                                                        width: `${Math.min(((memberTotals[member.id] || 0) / 1000) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Desktop FAB */}
            <div className="hidden md:block fixed bottom-8 right-8 z-50">
                <button
                    onClick={() => setView("add-receipt")}
                    className="h-16 px-8 rounded-full bg-primary text-white font-extrabold shadow-glow flex items-center gap-3 hover:scale-105 transition-transform text-lg"
                >
                    <Plus size={24} /> Add Expense
                </button>
            </div>

            {/* Mobile Bottom Navigation */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 h-[90px] glass-panel-heavy rounded-t-[32px] rounded-b-none flex items-start justify-between px-10 pt-3 shadow-[0_-5px_30px_rgba(0,0,0,0.05)] z-40 border-t border-white/40 pb-[env(safe-area-inset-bottom,20px)]">
                <button
                    onClick={() => setView("dashboard")}
                    className={`flex flex-col items-center justify-center gap-1 transition-all mt-1 ${view === "dashboard" ? "text-primary transform scale-105 font-bold" : "text-muted hover:text-text"
                        }`}
                >
                    <Home size={26} className={view === "dashboard" ? "fill-primary/20 stroke-[2.5px]" : "stroke-2"} />
                    <span className="text-[10px] font-medium">Home</span>
                </button>

                <div className="relative -top-10">
                    <button
                        onClick={() => setView("add-receipt")}
                        className="w-[72px] h-[72px] p-4 rounded-full bg-primary text-white shadow-glow-accent flex items-center justify-center transition-transform active:scale-95 border-[6px] border-bg hover:shadow-glow hover:-translate-y-1"
                    >
                        <Plus size={32} strokeWidth={3} />
                    </button>
                </div>

                <button
                    onClick={() => setView("members")}
                    className={`flex flex-col items-center justify-center gap-1 transition-all mt-1 ${view === "members" ? "text-primary transform scale-105 font-bold" : "text-muted hover:text-text"
                        }`}
                >
                    <Users size={26} className={view === "members" ? "fill-primary/20 stroke-[2.5px]" : "stroke-2"} />
                    <span className="text-[10px] font-medium">Members</span>
                </button>
            </div>
        </div>
    );
};

export default Dashboard;
