'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, ImageIcon, Loader2, ArrowLeft, Camera } from 'lucide-react';
import { useCreateCommunityMedia } from '@/hooks/community-media-hooks/use-create-community-media';
import { CommunityMediaGallery } from './community-media-gallery';
import Image from 'next/image';

interface CommunityMediaUploadModalProps {
    isOpen: boolean;
    onClose: () => void;
    communityId: string;
}

type ModalView = 'options' | 'upload' | 'gallery';

export function CommunityMediaUploadModal({ isOpen, onClose, communityId }: CommunityMediaUploadModalProps) {
    const [view, setView] = useState<ModalView>('options');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate: uploadMedia, isPending: isUploading } = useCreateCommunityMedia();

    // Reset state when modal opens/closes
    useEffect(() => {
        if (isOpen) {
            setView('options');
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }, [isOpen]);

    // Handle File Selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
            setView('upload');
        }
    };

    // Clean up blob URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleUploadSubmit = () => {
        if (!selectedFile) return;

        uploadMedia({
            file: selectedFile,
            communityId: communityId
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const handleBack = () => {
        setView('options');
        setSelectedFile(null);
        setPreviewUrl(null);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        {view !== 'options' && (
                            <button onClick={handleBack} className="p-1.5 hover:bg-muted rounded-full transition-colors mr-1">
                                <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                            </button>
                        )}
                        <Camera className="w-6 h-6 text-primary" />
                        Update Community Cover
                    </DialogTitle>
                    <DialogDescription>
                        {view === 'options' && `Choose how you want to update your community's cover photo.`}
                        {view === 'upload' && `Preview your new cover photo before saving.`}
                        {view === 'gallery' && "Select from previously uploaded photos."}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto">
                    {/* Render Options */}
                    {view === 'options' && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center fade-in">
                            <button
                                onClick={handleUploadClick}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-default hover:border-primary hover:bg-primary/5 rounded-2xl transition-all w-full sm:w-1/2 aspect-square group cursor-pointer"
                            >
                                <div className="p-4 bg-muted group-hover:bg-primary/10 rounded-full mb-4 transition-colors">
                                    <Upload className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Upload New</h3>
                                <p className="text-sm text-muted-foreground mt-2 text-center">Browse from your computer</p>
                            </button>

                            <button
                                onClick={() => setView('gallery')}
                                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-default hover:border-primary hover:bg-primary/5 rounded-2xl transition-all w-full sm:w-1/2 aspect-square group cursor-pointer"
                            >
                                <div className="p-4 bg-muted group-hover:bg-primary/10 rounded-full mb-4 transition-colors">
                                    <ImageIcon className="w-8 h-8 text-primary" />
                                </div>
                                <h3 className="font-semibold text-lg">Choose Existing</h3>
                                <p className="text-sm text-muted-foreground mt-2 text-center">Select from historic uploads</p>
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Render Image Preview and Upload Flow */}
                    {view === 'upload' && previewUrl && (
                        <div className="flex flex-col items-center py-2 fade-in">
                            <div className="relative overflow-hidden border-4 border-muted shadow-lg mb-8 w-full aspect-[3/1] rounded-xl bg-gradient-to-r from-primary/20 to-primary/5">
                                <Image
                                    src={previewUrl}
                                    alt="Media Preview"
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </div>

                            <div className="flex gap-4 w-full px-8">
                                <Button variant="outline" size="lg" className="flex-1" onClick={handleBack} disabled={isUploading}>
                                    Choose Another
                                </Button>
                                <Button size="lg" className="flex-1 btn-ai text-white" onClick={handleUploadSubmit} disabled={isUploading}>
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...
                                        </>
                                    ) : 'Save Cover Photo'}
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Render Gallery Flow */}
                    {view === 'gallery' && (
                        <CommunityMediaGallery communityId={communityId} onClose={onClose} />
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
