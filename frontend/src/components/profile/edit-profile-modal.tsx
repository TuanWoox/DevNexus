'use client';

import { useState, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { UpdateProfileDTO } from '@/types/profile/update-profile-dto';
import { SelectProfileDTO } from '@/types/profile/select-profile-dto';
import { useUpdateProfile } from '@/hooks/profile-hooks/use-update-profile';
import { Loader2, Code, X, Settings2, UserCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    // We pass the current profile explicitly to populate the form
    currentProfile: SelectProfileDTO | undefined | null;
}

export function EditProfileModal({ isOpen, onClose, currentProfile }: EditProfileModalProps) {
    const { mutate: updateProfile, isPending } = useUpdateProfile();

    const {
        register,
        handleSubmit,
        setValue,
        control,
        reset,
        formState: { errors }
    } = useForm<UpdateProfileDTO>({
        defaultValues: {
            id: '',
            fullName: '',
            bio: '',
            techStacks: [],
            isPrivate: false
        }
    });

    const [techInput, setTechInput] = useState('');
    const techStacks = useWatch({ control, name: 'techStacks' }) || [];

    // Initialize form values when modal opens or profile changes
    useEffect(() => {
        if (currentProfile && isOpen) {
            reset({
                id: currentProfile.id || currentProfile.applicationUserId || '',
                fullName: currentProfile.fullName || '',
                bio: currentProfile.bio || '',
                techStacks: currentProfile.techStacks || [],
                isPrivate: currentProfile.isPrivate ?? true // Use true as default fallback as requested by user
            });
            setTechInput('');
        }
    }, [currentProfile, isOpen, reset]);

    const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const newTech = techInput.trim();
            if (newTech && !techStacks.includes(newTech)) {
                setValue('techStacks', [...techStacks, newTech], { shouldDirty: true });
                setTechInput('');
            }
        }
    };

    const handleRemoveTech = (techToRemove: string) => {
        setValue('techStacks', techStacks.filter(tech => tech !== techToRemove), { shouldDirty: true });
    };

    const onSubmit = (data: UpdateProfileDTO) => {
        updateProfile(data, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Settings2 className="w-6 h-6 text-primary" />
                        Edit Profile
                    </DialogTitle>
                    <DialogDescription>
                        Update your personal details, bio, and technical expertise.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* Full Name */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="fullName" className="text-base font-medium text-heading">
                            Full Name
                        </label>
                        <div className="relative">
                            <UserCircle className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                id="fullName"
                                className={`input pl-9 w-full ${errors.fullName ? 'border-destructive' : ''}`}
                                placeholder="e.g. John Doe"
                                {...register('fullName', {
                                    required: 'Full name is required'
                                })}
                            />
                        </div>
                        {errors.fullName && (
                            <p className="text-xs text-destructive font-medium">{errors.fullName.message}</p>
                        )}
                    </div>

                    {/* Bio */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="bio" className="text-base font-medium text-heading">
                            Bio
                        </label>
                        <textarea
                            id="bio"
                            className={`input min-h-24 resize-y w-full ${errors.bio ? 'border-destructive' : ''}`}
                            placeholder="Tell us a bit about yourself..."
                            {...register('bio')}
                        />
                    </div>

                    {/* Tech Stacks */}
                    <div className="flex flex-col gap-1.5">
                        <label htmlFor="techInput" className="text-base font-medium text-heading">
                            Tech Stacks
                        </label>
                        <div className="relative">
                            <Code className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                id="techInput"
                                value={techInput}
                                onChange={(e) => setTechInput(e.target.value)}
                                onKeyDown={handleAddTech}
                                className="input pl-9 w-full"
                                placeholder="e.g. React, Node.js (Press Enter to add)"
                            />
                        </div>

                        {techStacks.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2 p-3 bg-muted/30 rounded-lg border border-default">
                                {techStacks.map((tech) => (
                                    <span
                                        key={tech}
                                        className="badge-default bg-background flex items-center gap-1.5 py-1 px-2.5 shadow-sm"
                                    >
                                        {tech}
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveTech(tech)}
                                            className="hover:text-destructive transition-colors focus:outline-none cursor-pointer"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center gap-3 p-4 bg-muted/30 border border-default rounded-xl mt-2">
                        <input
                            type="checkbox"
                            id="isPrivate"
                            className="w-5 h-5 accent-primary cursor-pointer rounded"
                            {...register('isPrivate')}
                        />
                        <div className="flex flex-col">
                            <label htmlFor="isPrivate" className="text-base font-semibold text-heading cursor-pointer">
                                Private Profile
                            </label>
                            <p className="text-sm text-muted-foreground">
                                Only you can see your saved posts and activities.
                            </p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-6">
                        <Button type="button" variant="custom" size="lg" className="btn-secondary" onClick={onClose} disabled={isPending}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isPending} size="lg" className="btn-ai text-white gap-2">
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
