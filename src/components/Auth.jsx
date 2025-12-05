import { ArrowRight, Lock, Plus, Users } from 'lucide-react';
import { useState } from 'react';
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
            <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{title}</h1>
            <p className="text-muted">{subtitle}</p>
        </div>
    );

    if (view === 'create') {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="glass-panel p-8 w-full max-w-md">
                    {renderHeader('Create Group', 'Start a new shared expense group')}
                    <form onSubmit={handleCreate} className="flex flex-col gap-4">
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Group Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Flat 302"
                                className="input-field"
                                value={createData.name}
                                onChange={e => setCreateData({ ...createData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Your Name</label>
                            <input
                                type="text"
                                placeholder="John Doe"
                                className="input-field"
                                value={createData.creatorName}
                                onChange={e => setCreateData({ ...createData, creatorName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Group PIN</label>
                            <input
                                type="tel"
                                maxLength="4"
                                placeholder="****"
                                className="input-field text-center tracking-[1em] font-mono"
                                value={createData.pin}
                                onChange={e => setCreateData({ ...createData, pin: e.target.value })}
                            />
                        </div>
                        {error && <p className="text-danger text-sm text-center bg-danger/10 p-2 rounded">{error}</p>}
                        <button type="submit" className="btn-primary mt-4 w-full">Create & Join</button>
                        <button type="button" onClick={() => setView('list')} className="btn-secondary w-full">Cancel</button>
                    </form>
                </div>
            </div>
        );
    }

    if (view === 'login') {
        return (
            <div className="flex items-center justify-center h-full animate-fade-in">
                <div className="glass-panel p-8 w-full max-w-md">
                    {renderHeader('Join Group', loginStep === 1 ? 'Enter your Group ID' : `Joining: ${fetchedGroup?.name}`)}

                    {loginStep === 1 ? (
                        <form onSubmit={handleFetchGroup} className="flex flex-col gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Group ID</label>
                                <input
                                    type="text"
                                    placeholder="Paste UUID here"
                                    className="input-field font-mono text-sm"
                                    value={groupIdInput}
                                    onChange={e => setGroupIdInput(e.target.value)}
                                />
                            </div>
                            {error && <p className="text-danger text-sm text-center bg-danger/10 p-2 rounded">{error}</p>}
                            <button type="submit" className="btn-primary mt-4 w-full">Next</button>
                            <button type="button" onClick={() => { setView('list'); setError(''); }} className="btn-secondary w-full">Back</button>
                        </form>
                    ) : (
                        <form onSubmit={handleLogin} className="flex flex-col gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Select Member</label>
                                <select
                                    className="input-field bg-surface-hover cursor-pointer"
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
                                <div className="space-y-1 animate-fade-in">
                                    <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Your Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className="input-field"
                                        value={loginData.name}
                                        onChange={e => setLoginData({ ...loginData, name: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">PIN</label>
                                <input
                                    type="tel"
                                    maxLength="4"
                                    placeholder="****"
                                    className="input-field text-center tracking-[1em] font-mono"
                                    value={loginData.pin}
                                    onChange={e => {
                                        setLoginData({ ...loginData, pin: e.target.value });
                                        setError('');
                                    }}
                                />
                            </div>
                            {error && <p className="text-danger text-sm text-center bg-danger/10 p-2 rounded">{error}</p>}
                            <button type="submit" className="btn-primary mt-4 w-full">
                                {selectedMemberId === 'new' ? 'Join Group' : 'Login'}
                            </button>
                            <button type="button" onClick={() => { setLoginStep(1); setLoginData({ name: '', pin: '' }); setError(''); }} className="btn-secondary w-full">Back</button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center h-full animate-fade-in p-4">
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 text-primary mb-6 shadow-glow">
                    <Users size={40} />
                </div>
                <h1 className="text-5xl font-bold mb-4 tracking-tight">SpiltBill</h1>
                <p className="text-xl text-muted max-w-md mx-auto">The easiest way to split expenses with friends, roommates, and travel buddies.</p>
            </div>

            <div className="grid gap-4 w-full max-w-md">
                <button
                    onClick={() => setView('login')}
                    className="glass-panel p-6 flex items-center justify-between hover:bg-surface-hover transition-all group"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-muted group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                            <Lock size={24} />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-lg">Login</span>
                            <span className="text-sm text-muted">Enter an existing Group ID</span>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-muted group-hover:text-primary transition-colors" />
                </button>

                <button
                    onClick={() => setView('create')}
                    className="glass-panel p-6 flex items-center justify-between hover:bg-surface-hover transition-all group border-primary/30"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-black transition-colors">
                            <Plus size={24} />
                        </div>
                        <div className="text-left">
                            <span className="block font-semibold text-lg text-primary">Create Group</span>
                            <span className="text-sm text-muted">Start a new shared ledger</span>
                        </div>
                    </div>
                    <ArrowRight size={20} className="text-primary" />
                </button>
            </div>
        </div>
    );
};

export default Auth;

