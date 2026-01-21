import { ArrowRight, Lock, Plus, Users } from 'lucide-react';
import { useState } from 'react';
import splitBillIllustration from '../assets/split_bill_illustration_1769014044585.png';
import { useAppStore } from '../store/AppStore';

const Auth = () => {
    const { state, actions } = useAppStore();
    const [view, setView] = useState('list'); // list, create, login
    const [createData, setCreateData] = useState({ name: '', pin: '', creatorName: '' });
    const [loginData, setLoginData] = useState({ name: '', pin: '' });
    const [error, setError] = useState('');
    const [groupIdInput, setGroupIdInput] = useState('');

    const handleCreate = (e) => {
        e.preventDefault();
        if (createData.name && createData.pin.length === 4 && createData.creatorName) {
            actions.createProfile(createData.name, createData.pin, createData.creatorName);
        } else {
            setError('Please fill all fields. PIN must be 4 digits.');
        }
    };

    const [loginStep, setLoginStep] = useState(1); // 1: Group ID, 2: Select Member
    const [fetchedGroup, setFetchedGroup] = useState(null);
    const [selectedMemberId, setSelectedMemberId] = useState(''); // '' means new member

    const handleFetchGroup = async (e) => {
        e.preventDefault();
        if (groupIdInput) {
            const group = await actions.getGroupDetails(groupIdInput);
            if (group) {
                setFetchedGroup(group);
                setLoginStep(2);
                setError('');
            }
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        if (selectedMemberId === 'new') {
            if (loginData.name && loginData.pin) {
                actions.joinGroup(fetchedGroup.public_id, loginData.name, loginData.pin);
            } else {
                setError('Please enter Name and PIN');
            }
        } else {
            // Existing member
            const member = fetchedGroup.members.find(m => m.id === selectedMemberId);
            if (member && loginData.pin) {
                actions.joinGroup(fetchedGroup.public_id, member.name, loginData.pin);
            } else {
                setError('Please select a member and enter PIN');
            }
        }
    };

    const renderHeader = (title, subtitle) => (
        <div className="mb-8 text-center">
            <h1 className="text-3xl font-extrabold mb-2 text-primary tracking-tight">{title}</h1>
            <p className="text-muted font-medium">{subtitle}</p>
        </div>
    );

    if (view === 'create') {
        return (
            <div className="flex items-center justify-center min-h-screen animate-fade-in p-4 w-full bg-white">
                <div className="glass-panel p-6 w-full max-w-sm shadow-xl bg-surface/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"></div>
                    {renderHeader('Create Group', 'Start a new shared expense group')}
                    <form onSubmit={handleCreate} className="flex flex-col gap-5 relative z-10">
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Flat 302"
                                className="input-field"
                                value={createData.name}
                                onChange={e => setCreateData({ ...createData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Your Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="input-field"
                                value={createData.creatorName}
                                onChange={e => setCreateData({ ...createData, creatorName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Group PIN</label>
                            <input
                                type="tel"
                                maxLength="4"
                                placeholder="****"
                                className="input-field text-center tracking-[1em] font-mono text-lg"
                                value={createData.pin}
                                onChange={e => setCreateData({ ...createData, pin: e.target.value })}
                            />
                        </div>
                        {error && <p className="text-danger text-sm text-center bg-danger/10 p-3 rounded-xl border border-danger/20 font-medium">{error}</p>}
                        <div className="pt-2 flex flex-col gap-3">
                            <button type="submit" className="btn-primary w-full shadow-lg hover:shadow-glow transition-all py-3.5 justify-center">Create & Join</button>
                            <button type="button" onClick={() => setView('list')} className="btn-secondary w-full py-3.5 justify-center">Cancel</button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    if (view === 'login') {
        return (
            <div className="flex items-center justify-center min-h-screen animate-fade-in p-4 w-full bg-white">
                <div className="glass-panel p-6 w-full max-w-sm shadow-xl bg-surface/80 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-primary"></div>
                    {renderHeader('Join Group', loginStep === 1 ? 'Enter your Group ID' : `Joining: ${fetchedGroup?.name}`)}

                    {loginStep === 1 ? (
                        <form onSubmit={handleFetchGroup} className="flex flex-col gap-5 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Group ID</label>
                                <input
                                    type="text"
                                    placeholder="Paste UUID here"
                                    className="input-field font-mono text-sm"
                                    value={groupIdInput}
                                    onChange={e => setGroupIdInput(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-danger text-sm text-center bg-danger/10 p-3 rounded-xl border border-danger/20 font-medium">{error}</p>}
                            <div className="pt-2 flex flex-col gap-3">
                                <button type="submit" className="btn-primary w-full shadow-lg hover:shadow-glow transition-all py-3.5 justify-center">Next</button>
                                <button type="button" onClick={() => { setView('list'); setError(''); }} className="btn-secondary w-full py-3.5 justify-center">Back</button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="flex flex-col gap-5 relative z-10">
                            <div className="space-y-1.5">
                                <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Select Member</label>
                                <select
                                    className="input-field bg-surface cursor-pointer"
                                    value={selectedMemberId}
                                    onChange={e => setSelectedMemberId(e.target.value)}
                                >
                                    <option value="" disabled>Who are you?</option>
                                    {fetchedGroup?.members.map(m => (
                                        <option key={m.id} value={m.id}>{m.name}</option>
                                    ))}
                                    <option value="new">+ Register New Member</option>
                                </select>
                            </div>

                            {selectedMemberId === 'new' && (
                                <div className="space-y-1.5 animate-fade-in">
                                    <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="input-field"
                                        value={loginData.name}
                                        onChange={e => setLoginData({ ...loginData, name: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-1.5">
                                <label className="text-xs text-muted uppercase tracking-wider font-bold ml-1">PIN</label>
                                <input
                                    type="tel"
                                    maxLength="4"
                                    placeholder="****"
                                    className="input-field text-center tracking-[1em] font-mono text-lg"
                                    value={loginData.pin}
                                    onChange={e => {
                                        setLoginData({ ...loginData, pin: e.target.value });
                                        setError('');
                                    }}
                                />
                            </div>
                            {error && <p className="text-danger text-sm text-center bg-danger/10 p-3 rounded-xl border border-danger/20 font-medium">{error}</p>}
                            <div className="pt-2 flex flex-col gap-3">
                                <button type="submit" className="btn-primary w-full shadow-lg hover:shadow-glow transition-all py-3.5 justify-center">
                                    {selectedMemberId === 'new' ? 'Join Group' : 'Login'}
                                </button>
                                <button type="button" onClick={() => { setLoginStep(1); setLoginData({ name: '', pin: '' }); setError(''); }} className="btn-secondary w-full py-3.5 justify-center">Back</button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-white text-text selection:bg-primary selection:text-white overflow-hidden">
            {/* Left Content Section */}
            <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-10 relative z-10">
                <div className="w-full max-w-sm flex flex-col items-center text-center">

                    {/* Logo/Icon */}
                    <div className="mb-6">
                        <Users size={64} className="text-primary" strokeWidth={2.5} />
                    </div>

                    {/* Branding */}
                    <h1 className="text-4xl font-extrabold text-primary mb-3 tracking-tight">SplitBill</h1>
                    <p className="text-base text-muted max-w-[280px] font-medium leading-relaxed mb-8">
                        The easiest way to split expenses with friends, roommates, and travel buddies.
                    </p>

                    {/* Action Buttons */}
                    <div className="w-full space-y-4">
                        {/* Create Group - Primary */}
                        <button
                            onClick={() => setView('create')}
                            className="group w-full bg-primary hover:bg-primary-dim text-white rounded-[20px] p-4 pl-6 pr-5 flex items-center justify-between transition-all shadow-lg hover:shadow-primary/30"
                        >
                            <div className="flex items-center gap-4">
                                <Plus size={24} className="text-white/90" />
                                <div className="flex flex-col items-start gap-0">
                                    <span className="text-base font-bold leading-tight">Create Group</span>
                                    <span className="text-xs font-medium text-white/80">Start a new shared ledger</span>
                                </div>
                            </div>
                            <ArrowRight size={20} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>

                        {/* Login - Secondary */}
                        <button
                            onClick={() => setView('login')}
                            className="group w-full bg-white border-[2px] border-primary text-primary rounded-[20px] p-4 pl-6 pr-5 flex items-center justify-between transition-all hover:bg-primary/5"
                        >
                            <div className="flex items-center gap-4">
                                <Lock size={24} className="text-primary/90" />
                                <div className="flex flex-col items-start gap-0">
                                    <span className="text-base font-bold leading-tight">Login</span>
                                    <span className="text-xs font-medium text-primary/80">Enter an existing Group ID</span>
                                </div>
                            </div>
                            <ArrowRight size={20} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Mobile Illustration (Visible only on small screens) */}
                <div className="mt-10 lg:hidden w-full max-w-xs flex justify-center">
                    <img src={splitBillIllustration} alt="Split Expenses" className="w-full h-auto drop-shadow-xl" />
                </div>
            </div>

            {/* Right Illustration Section (Desktop Only) */}
            <div className="hidden lg:flex w-1/2 bg-white items-center justify-center p-10 relative">
                {/* Decorative blob behind image */}
                <div className="absolute w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl -z-10"></div>
                <img
                    src={splitBillIllustration}
                    alt="Friends splitting bill"
                    className="w-full max-w-xl object-contain drop-shadow-2xl animate-fade-in"
                />
            </div>
        </div>
    );
};

export default Auth;
