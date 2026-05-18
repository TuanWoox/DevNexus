import { useState } from 'react';
import { contentMediaService, buildMediaUrl } from '@/services/content-media-service';
import { ContentType } from '@/types/content-media/content-type';
import { computeFileHash, chunkFile } from '@/utils/file-hash';

interface UploadResult {
    blobUrl: string;
    serverUrl: string;
    mediaId: string;
}

interface UseUploadContentMediaReturn {
    uploadPendingMedia: (contentType: ContentType, pendingFiles: Map<string, File>) => Promise<UploadResult[]>;
    isUploading: boolean;
    progress: { current: number; total: number } | null;
    error: string | null;
}

const VIDEO_EXTENSION_REGEX = /\.(mp4|mov|avi|mkv|webm|flv|wmv)$/i;

function isVideoFile(file: File): boolean {
    return file.type.startsWith('video/') || VIDEO_EXTENSION_REGEX.test(file.name);
}

export function useUploadContentMedia(): UseUploadContentMediaReturn {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const uploadPendingMedia = async (
        contentType: ContentType,
        pendingFiles: Map<string, File>
    ): Promise<UploadResult[]> => {
        setIsUploading(true);
        setError(null);

        const results: UploadResult[] = [];
        const entries = Array.from(pendingFiles.entries());
        setProgress({ current: 0, total: entries.length });

        try {
            for (let i = 0; i < entries.length; i++) {
                const [blobUrl, file] = entries[i];

                if (isVideoFile(file)) {
                    const fileHash = await computeFileHash(file);
                    const initResult = await contentMediaService.initVideoUpload(contentType, {
                        fileName: file.name,
                        hashFile: fileHash
                    });

                    if (initResult.isDuplicate && initResult.existingMedia) {
                        const mediaId = initResult.existingMedia.id;
                        results.push({ blobUrl, serverUrl: buildMediaUrl(mediaId, contentType), mediaId });
                    } else {
                        if (!initResult.sessionId) throw new Error('Video upload session was not created');

                        const chunks = chunkFile(file);
                        for (let j = 0; j < chunks.length; j++) {
                            await contentMediaService.uploadVideoChunk(contentType, {
                                sessionId: initResult.sessionId,
                                chunkIndex: j,
                                totalChunks: chunks.length,
                                chunk: chunks[j]
                            });
                        }

                        const mediaId = await contentMediaService.mergeVideoChunks(contentType, {
                            sessionId: initResult.sessionId,
                            fileName: file.name,
                            totalChunks: chunks.length,
                            fileHash
                        });
                        results.push({ blobUrl, serverUrl: buildMediaUrl(mediaId, contentType), mediaId });
                    }
                } else {
                    const mediaId = await contentMediaService.uploadImage(contentType, file);
                    results.push({ blobUrl, serverUrl: buildMediaUrl(mediaId, contentType), mediaId });
                }

                setProgress({ current: i + 1, total: entries.length });
            }

            return results;
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to upload media';
            setError(message);
            throw new Error(message);
        } finally {
            setIsUploading(false);
            setProgress(null);
        }
    };

    return { uploadPendingMedia, isUploading, progress, error };
}
