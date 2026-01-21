import { ArrowRight, Camera, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/AppStore';

const AddReceipt = ({ onBack }) => {
    const { currentProfile, actions, currentMemberId } = useAppStore();
    const [step, setStep] = useState(1); // 1: Image/Total, 2: Payer/Split
    const [total, setTotal] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null); // URL for preview
    const [imageFile, setImageFile] = useState(null); // File object for upload
    const [payerId, setPayerId] = useState(currentMemberId || currentProfile.members[0]?.id);
    const [selectedMembers, setSelectedMembers] = useState(
        currentProfile.members.map(m => m.id) // Default all selected
    );

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(URL.createObjectURL(file));
            setImageFile(file);
        }
    };

    const toggleMember = (id) => {
        if (selectedMembers.includes(id)) {
            setSelectedMembers(selectedMembers.filter(m => m !== id));
        } else {
            setSelectedMembers([...selectedMembers, id]);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!total || parseFloat(total) <= 0) return;
        if (selectedMembers.length === 0) return;

        actions.addReceipt(parseFloat(total), payerId, selectedMembers, imageFile, description);
        onBack();
    };

    if (step === 1) {
        return (
            <div className="flex flex-col h-full animate-fade-in pb-4 md:pb-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-2xl text-gradient">New Expense</h2>
                    <button onClick={onBack} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-muted"><X /></button>
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                    {/* Image Upload Mock */}
                    <div className="h-48 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-surface relative overflow-hidden group hover:border-primary/50 transition-all cursor-pointer">
                        {image ? (
                            <img src={image} alt="Receipt" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                        ) : (
                            <div className="flex flex-col items-center text-muted group-hover:text-primary transition-colors">
                                <Camera size={32} className="mb-2" />
                                <span className="text-sm font-medium">Add Receipt Photo</span>
                            </div>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                        />
                    </div>

                    {/* Total Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Total Amount</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">£</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="w-full bg-surface border border-border rounded-2xl p-4 pl-10 text-4xl font-bold outline-none focus:border-primary focus:shadow-glow transition-all text-text placeholder-muted/30"
                                value={total}
                                onChange={e => setTotal(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>

                    {/* Description Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Description</label>
                        <input
                            type="text"
                            placeholder="What is this for?"
                            className="input-field bg-surface border-border focus:border-primary/50"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    onClick={() => total && setStep(2)}
                    disabled={!total}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6 py-4 text-lg shadow-lg"
                >
                    Next <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in pb-4 md:pb-0">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep(1)} className="text-muted hover:text-text transition-colors flex items-center gap-1 font-medium">
                    <ArrowRight size={16} className="rotate-180" /> Back
                </button>
                <h2 className="font-bold text-xl text-text">Split Details</h2>
                <div className="w-12"></div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-8">
                {/* Payer Selection */}
                <section>
                    <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-3 block ml-1">Who paid?</label>
                    <div className="flex flex-wrap gap-2">
                        {currentProfile.members.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setPayerId(member.id)}
                                className={`px-4 py-2 rounded-full border transition-all text-sm font-semibold transform active:scale-95 ${payerId === member.id
                                    ? 'bg-primary text-white border-primary shadow-glow'
                                    : 'bg-surface border-border text-muted hover:border-primary/30'
                                    }`}
                            >
                                {member.name}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Split Selection */}
                <section>
                    <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-3 block ml-1">Split with whom?</label>
                    <div className="grid gap-2">
                        {currentProfile.members.map(member => {
                            const isSelected = selectedMembers.includes(member.id);
                            return (
                                <button
                                    key={member.id}
                                    onClick={() => toggleMember(member.id)}
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${isSelected
                                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                                        : 'bg-surface border-border text-muted opacity-80 hover:opacity-100'
                                        }`}
                                >
                                    <span className="font-medium text-lg">{member.name}</span>
                                    {isSelected && <div className="bg-primary text-white rounded-full p-0.5"><Check size={14} strokeWidth={3} /></div>}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedMembers.length === 0}
                className="btn-primary w-full mt-6 py-4 text-lg shadow-lg"
            >
                Add Expense
            </button>
        </div>
    );
};

export default AddReceipt;
