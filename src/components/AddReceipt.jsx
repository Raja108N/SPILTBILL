import imageCompression from 'browser-image-compression';
import { ArrowRight, Camera, Check, Image as ImageIcon, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
    const [isCompressing, setIsCompressing] = useState(false);

    // Camera State
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    // Effect to attach stream to video element when it becomes available
    useEffect(() => {
        if (isCameraOpen && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
    }, [isCameraOpen]);

    const startCamera = async () => {
        try {
            // Try environment facing camera first (phones)
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: "environment" }
                });
                streamRef.current = stream;
                setIsCameraOpen(true);
            } catch (envError) {
                console.warn("Environment camera not found, trying fallback...", envError);
                // Fallback to any available camera (laptops/desktops)
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: true
                });
                streamRef.current = stream;
                setIsCameraOpen(true);
            }
        } catch (err) {
            console.error("Camera error:", err);
            setIsCameraOpen(false);
            alert("Could not access camera. Please ensure you have granted camera permissions and are using HTTPS or localhost.");
        }
    };

    const handleCompressAndSet = async (file) => {
        setIsCompressing(true);
        // Immediate feedback: Show and use original file while compressing
        const tempUrl = URL.createObjectURL(file);
        setImage(tempUrl);
        setImageFile(file);

        try {
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1600,
                useWebWorker: true,
                fileType: "image/webp",
                initialQuality: 0.8
            };
            const compressedFile = await imageCompression(file, options);

            // Swap to compressed version
            URL.revokeObjectURL(tempUrl);
            setImage(URL.createObjectURL(compressedFile));
            setImageFile(compressedFile);
        } catch (error) {
            console.error("Compression error:", error);
            // Already set to original file, so just stay there
        } finally {
            setIsCompressing(false);
        }
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            handleCompressAndSet(file);
        }
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            canvas.toBlob((blob) => {
                if (blob) {
                    const file = new File([blob], "camera_capture.webp", { type: "image/webp" });
                    handleCompressAndSet(file);
                    stopCamera();
                }
            }, 'image/webp', 0.9);
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

    if (isCameraOpen) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col animate-fade-in">
                {/* Hidden Canvas for Capture */}
                <canvas ref={canvasRef} className="hidden" />

                <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Overlay Guides */}
                    <div className="absolute inset-8 border-2 border-white/20 rounded-xl pointer-events-none">
                        <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl" />
                        <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl" />
                        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl" />
                        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl" />
                    </div>
                </div>

                <div className="h-32 bg-black/80 backdrop-blur-md flex items-center justify-around px-8 pb-4">
                    <button
                        onClick={stopCamera}
                        className="p-4 rounded-full bg-surface/20 text-white hover:bg-surface/40 transition-colors"
                    >
                        <X size={24} />
                    </button>

                    <button
                        onClick={capturePhoto}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-95 transition-transform"
                    >
                        <div className="w-16 h-16 bg-white rounded-full" />
                    </button>

                    <div className="w-12" /> {/* Spacer for balance */}
                </div>
            </div>
        );
    }

    if (step === 1) {
        return (
            <div className="flex flex-col h-full animate-fade-in pb-4 md:pb-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="font-bold text-2xl text-gradient">New Expense</h2>
                    <button onClick={onBack} className="p-2 hover:bg-surface-hover rounded-full transition-colors text-muted"><X /></button>
                </div>

                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                    {/* Image Upload Split View */}
                    <div className="h-48 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center bg-surface relative overflow-hidden transition-all">
                        {image ? (
                            <>
                                <img src={image} alt="Receipt" className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/20" />
                                <button
                                    onClick={(e) => { e.preventDefault(); setImage(null); setImageFile(null); }}
                                    className="absolute top-2 right-2 p-2 bg-black/50 text-white rounded-full hover:bg-danger transition-colors z-10 backdrop-blur-sm"
                                >
                                    <X size={16} />
                                </button>
                            </>
                        ) : (
                            <div className="flex w-full h-full divide-x divide-border">
                                <label className="flex-1 flex flex-col items-center justify-center hover:bg-surface-hover cursor-pointer group active:bg-primary/5 transition-colors" onClick={(e) => {
                                    e.preventDefault();
                                    startCamera();
                                }}>
                                    <div className="p-3.5 bg-primary/10 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                        <Camera size={26} className="text-primary" />
                                    </div>
                                    <span className="text-xs font-bold text-muted uppercase tracking-wider group-hover:text-primary transition-colors">Camera</span>
                                </label>
                                <label className="flex-1 flex flex-col items-center justify-center hover:bg-surface-hover cursor-pointer group active:bg-accent/5 transition-colors">
                                    <div className="p-3.5 bg-accent/10 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                        <ImageIcon size={26} className="text-accent" />
                                    </div>
                                    <span className="text-xs font-bold text-muted uppercase tracking-wider group-hover:text-accent transition-colors">{isCompressing ? 'Processing...' : 'Gallery / Files'}</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                    />
                                </label>
                            </div>
                        )}
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
