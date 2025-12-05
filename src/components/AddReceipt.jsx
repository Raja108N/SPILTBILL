import { ArrowRight, Camera, Check, X } from 'lucide-react';
import { useState } from 'react';
import { useAppStore } from '../store/AppStore';

const AddReceipt = ({ onBack }) => {
    const { currentProfile, actions } = useAppStore();
    const [step, setStep] = useState(1); // 1: Image/Total, 2: Payer/Split
    const [total, setTotal] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState(null); // URL for preview
    const [imageFile, setImageFile] = useState(null); // File object for upload
    const [payerId, setPayerId] = useState(currentProfile.members[0]?.id);
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
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-2xl">New Expense</h2>
                    <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
                </div>

                <div className="flex-1 flex flex-col gap-6">
                    {/* Image Upload Mock */}
                    <div className="h-48 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-surface/30 relative overflow-hidden group hover:border-primary/50 transition-colors">
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

                    {/* Description Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Description</label>
                        <input
                            type="text"
                            placeholder="What is this for?"
                            className="input-field"
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                        />
                    </div>

                    {/* Total Input */}
                    <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted uppercase tracking-wider font-semibold ml-1">Total Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-primary">£</span>
                            <input
                                type="number"
                                inputMode="decimal"
                                placeholder="0.00"
                                className="w-full bg-surface border border-white/10 rounded-2xl p-4 pl-10 text-4xl font-bold outline-none focus:border-primary focus:shadow-glow transition-all"
                                value={total}
                                onChange={e => setTotal(e.target.value)}
                                autoFocus
                            />
                        </div>
                    </div>
                </div>

                <button
                    onClick={() => total && setStep(2)}
                    disabled={!total}
                    className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                    Next <ArrowRight size={20} />
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="flex items-center justify-between mb-6">
                <button onClick={() => setStep(1)} className="text-muted hover:text-white transition-colors">Back</button>
                <h2 className="font-bold text-xl">Split Details</h2>
                <div className="w-8"></div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {/* Payer Selection */}
                <section className="mb-8">
                    <label className="text-xs text-muted uppercase tracking-wider font-semibold mb-3 block ml-1">Who paid?</label>
                    <div className="flex flex-wrap gap-2">
                        {currentProfile.members.map(member => (
                            <button
                                key={member.id}
                                onClick={() => setPayerId(member.id)}
                                className={`px-4 py-2 rounded-full border transition-all ${payerId === member.id
                                    ? 'bg-primary text-black border-primary font-bold shadow-glow'
                                    : 'bg-surface/50 border-white/10 text-muted hover:border-white/30'
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
                                    className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isSelected
                                        ? 'bg-primary/10 border-primary text-white'
                                        : 'bg-surface/50 border-white/10 text-muted opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <span className="font-medium">{member.name}</span>
                                    {isSelected && <Check size={20} className="text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </section>
            </div>

            <button
                onClick={handleSubmit}
                disabled={selectedMembers.length === 0}
                className="btn-primary w-full mt-6"
            >
                Add Expense
            </button>
        </div>
    );
};

export default AddReceipt;
