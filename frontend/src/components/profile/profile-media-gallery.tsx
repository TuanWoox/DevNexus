'use client';

import { useGetProfileMediasWithPagination } from '@/hooks/profile-media-hooks/use-get-profile-media-with-pagination';
import { useUpdatePrimaryProfileMedia } from '@/hooks/profile-media-hooks/use-update-primary-profile-media';
import { ProfileMediaType } from '@/types/profile-media/profile-media-type';
import { SortOrderType } from '@/constants/sortOrderType';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import Image from 'next/image';

interface ProfileMediaGalleryProps {
    profileId: string;
    mediaType: ProfileMediaType;
    onClose: () => void;
}

export function ProfileMediaGallery({ profileId, mediaType, onClose }: ProfileMediaGalleryProps) {
    const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null);

    const { data: pagedData, isLoading } = useGetProfileMediasWithPagination(profileId, {
        size: 20,
        pageNumber: 0,
        totalElements: 0,
        orders: [{ sort: 'dateCreated', sortDir: SortOrderType.DESC, dynamicProperty: '', delimiter: '', dataType: '' }],
        filter: [],
        selected: []
    });

    const { mutate: setPrimaryMedia, isPending } = useUpdatePrimaryProfileMedia();

    const handleConfirm = () => {
        if (!selectedMediaId) return;

        setPrimaryMedia({
            id: selectedMediaId,
            profileMediaType: mediaType
        }, {
            onSuccess: () => {
                onClose();
            }
        });
    };

    const getImageUrl = (id: string) => {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL_HTTPS || process.env.NEXT_PUBLIC_API_URL_HTTP;
        return `${baseUrl}/ProfileMedia/${id}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground font-medium animate-pulse">Loading previous avatars...</p>
            </div>
        );
    }

    const mediaList = pagedData?.data?.filter(m => m.profileMediaType === mediaType) || [];

    return (
        <div className="flex flex-col h-full fade-in">
            {mediaList.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-12 text-center bg-muted/20 border border-dashed rounded-xl">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <span className="text-2xl">🖼️</span>
                    </div>
                    <p className="text-muted-foreground font-medium">No previous uploads found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 overflow-y-auto pr-2 max-h-[50vh]">
                    {mediaList.map((media) => {
                        const isSelected = selectedMediaId === media.id;
                        return (
                            <div
                                key={media.id}
                                onClick={() => setSelectedMediaId(media.id)}
                                className={`relative aspect-square cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-200 
                                    ${isSelected ? 'border-primary shadow-md z-10' : 'border-transparent hover:border-primary/50'}`
                                }
                            >
                                <div className="absolute inset-0 bg-muted">
                                    <Image
                                        src={getImageUrl(media.id)}
                                        alt="Avatar selection"
                                        fill
                                        unoptimized
                                        className="object-cover"
                                    />
                                </div>
                                {isSelected && (
                                    <div className="absolute top-2 right-2 bg-background/80 rounded-full">
                                        <CheckCircle2 className="w-6 h-6 text-primary" />
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t px-1 pb-1">
                <Button variant="custom" size="lg" className="btn-secondary" onClick={onClose} disabled={isPending}>
                    Cancel
                </Button>
                <Button
                    variant="custom"
                    size="lg"
                    className="btn-ai"
                    disabled={!selectedMediaId || isPending}
                    onClick={handleConfirm}
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Setting...
                        </>
                    ) : mediaType === ProfileMediaType.Avatar ? 'Set as Avatar' : 'Set as Background'}
                </Button>
            </div>
        </div>
    );
}
