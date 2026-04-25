"use client";

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Users, Upload, ImageIcon } from "lucide-react";
import { useCreateCommunity } from "@/hooks/community-hooks/use-create-community";
import { CreateCommunityDTO } from "@/types/community/create-community-dto";
import Image from "next/image";
import { useCreateCommunityMedia } from "@/hooks/community-media-hooks/use-create-community-media";

interface CreateCommunityModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function CreateCommunityModal({ isOpen, onClose }: CreateCommunityModalProps) {
    const { mutateAsync: createCommunity, isPending: isCreating } = useCreateCommunity();
    const { mutate: uploadMedia, isPending: isUploading } = useCreateCommunityMedia();

    // UI states
    const [step, setStep] = useState<1 | 2>(1);
    const [createdCommunityId, setCreatedCommunityId] = useState<string | null>(null);

    // Cover Photo UI states (Phase 2 UI only)
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors }
    } = useForm<CreateCommunityDTO>({
        defaultValues: {
            name: "",
            description: "",
            slug: "",
            isPrivate: false
        }
    });

    const isPrivateValue = watch("isPrivate");

    // Reset everything when dialog operates
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setCreatedCommunityId(null);
            reset();
            setSelectedFile(null);
            setPreviewUrl(null);
        }
    }, [isOpen, reset]);

    const handlePhase1Submit = async (data: CreateCommunityDTO) => {
        try {
            // Trim values before submitting
            const payload = {
                ...data,
                name: data.name.trim(),
                description: data.description?.trim(),
                slug: data.slug?.trim() || undefined // If empty, backend generates it
            };

            const result = await createCommunity(payload);
            if (result && result.id) {
                setCreatedCommunityId(result.id);
                setStep(2); // Proceed to photo upload
            }
        } catch (error) {
            console.error("Failed to create community", error);
        }
    };

    // --- Phase 2 Handlers (UI Only) ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFinish = () => {
        if (!selectedFile || !createdCommunityId) return;

        uploadMedia({
            file: selectedFile,
            communityId: createdCommunityId
        }, {
            onSuccess: () => {
                onClose()
            }
        });
    };

    // Clean up preview URL
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-xl flex flex-col overflow-hidden max-h-[90vh]">
                <DialogHeader className="shrink-0">
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Users className="w-6 h-6 text-primary" />
                        {step === 1 ? "Create Community" : "Upload Cover Photo"}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 1
                            ? "Tell us about your community. You can change these details later."
                            : "Give your community an identity. (You can skip this and add it later)"}
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto px-2">
                    {/* ----- PHASE 1: FORM ----- */}
                    {step === 1 && (
                        <form id="create-community-form" onSubmit={handleSubmit(handlePhase1Submit)} className="space-y-5 fade-in">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold">
                                    Community Name <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    id="name"
                                    placeholder="e.g. Next.js Developers, System Design Enthusiasts..."
                                    {...register("name", {
                                        required: "Community name is required",
                                        minLength: { value: 3, message: "Name must be at least 3 characters" },
                                        maxLength: { value: 256, message: "Name cannot exceed 256 characters" }
                                    })}
                                    className={errors.name ? "border-red-500" : ""}
                                />
                                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what your community is all about..."
                                    rows={4}
                                    {...register("description", {
                                        maxLength: { value: 5000, message: "Description cannot exceed 5000 characters" }
                                    })}
                                    className={`resize-none ${errors.description ? "border-red-500" : ""}`}
                                />
                                {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug" className="text-sm font-semibold text-muted-foreground flex items-center justify-between">
                                    Custom URL Slug (Optional)
                                    <span className="text-xs font-normal">Leave blank to auto-generate</span>
                                </Label>
                                <div className="flex rounded-md overflow-hidden border focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                    <span className="px-3 py-2 bg-muted text-muted-foreground text-sm border-r flex items-center shrink-0">
                                        devnexus.com/communities/
                                    </span>
                                    <Input
                                        id="slug"
                                        placeholder="my-awesome-community"
                                        {...register("slug", {
                                            pattern: {
                                                value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
                                                message: "Slug must be lowercase with hyphens only"
                                            }
                                        })}
                                        className={`border-0 focus-visible:ring-0 focus-visible:ring-offset-0 ${errors.slug ? "text-red-500" : ""}`}
                                    />
                                </div>
                                {errors.slug && <p className="text-sm text-red-500">{errors.slug.message}</p>}
                            </div>

                            <div className="flex flex-row items-center justify-between p-4 bg-muted/30 rounded-lg border">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Private Community</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Only approved members can view posts and participate.
                                    </p>
                                </div>
                                <Switch
                                    checked={isPrivateValue}
                                    onCheckedChange={(checked: boolean) => setValue("isPrivate", checked)}
                                />
                            </div>
                        </form>
                    )}

                    {/* ----- PHASE 2: COVER PHOTO UI ----- */}
                    {step === 2 && (
                        <div className="flex flex-col items-center fade-in">
                            <div
                                className="w-full aspect-[21/9] relative border-2 border-dashed border-default hover:border-primary/50  rounded-xl overflow-hidden group cursor-pointer transition-colors bg-muted/30"
                                onClick={handleUploadClick}
                            >
                                {previewUrl ? (
                                    <Image
                                        src={previewUrl}
                                        alt="Cover Preview"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground hover:text-foreground transition-colors p-4 text-center">
                                        <div className="p-4 bg-background group-hover:bg-primary/10 rounded-full mb-3 shadow-sm transition-colors">
                                            <ImageIcon className="w-8 h-8 text-primary" />
                                        </div>
                                        <p className="font-medium text-lg text-foreground">Click to upload cover photo</p>
                                        <p className="text-sm mt-1">Recommended size: 1200 x 400px</p>
                                    </div>
                                )}

                                {previewUrl && (
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="flex items-center gap-2 text-white font-medium bg-black/40 backdrop-blur-md px-4 py-2 rounded-full">
                                            <Upload className="w-4 h-4" /> Change Photo
                                        </div>
                                    </div>
                                )}
                            </div>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept="image/jpeg, image/png, image/webp"
                                className="hidden"
                            />

                            {/* UI Placeholder Note */}
                            {/* <div className="mt-8 p-4 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm flex gap-3 text-left w-full">
                                <div className="w-5 h-5 shrink-0 mt-0.5" >💡</div>
                                <div>
                                    <p className="font-semibold mb-1">Coming Soon!</p>
                                    <p>The cover photo upload API is currently being integrated. You can hit &quot;Skip for now&quot; to complete the creation process.</p>
                                </div>
                            </div> */}
                        </div>
                    )}
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t shrink-0">
                    {step === 1 ? (
                        <>
                            <Button variant="outline" type="button" onClick={onClose} disabled={isCreating}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                form="create-community-form"
                                className="btn-ai text-white"
                                disabled={isCreating}
                            >
                                {isCreating ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                                ) : "Create & Continue"}
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={handleFinish}>
                                Skip for now
                            </Button>
                            <Button className="btn-ai text-white" onClick={handleFinish} disabled={!selectedFile}>
                                Upload & Finish
                            </Button>
                        </>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
