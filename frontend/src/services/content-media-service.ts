import api from '@/lib/axiosConfig';
import { ContentType } from '@/types/content-media/content-type';
import { ReturnResult } from '@/types/common/return-result';

interface MediaDTO {
    id: string;
}

interface ContentInitUploadVideoDTO {
    sessionId?: string;
    tempPath?: string;
    isDuplicate?: boolean;
    existingMedia?: MediaDTO;
}

export interface VideoChunkProgressDTO {
    receivedChunks: number;
    totalChunks: number;
    isComplete: boolean;
}

export interface UploadVideoChunkDTO {
    sessionId: string;
    chunkIndex: number;
    totalChunks: number;
    chunk: File;
}

export interface MergeVideoChunkDTO {
    sessionId: string;
    fileName: string;
    totalChunks: number;
    fileHash: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL_HTTPS || process.env.NEXT_PUBLIC_API_URL_HTTP || '';

export function buildMediaUrl(id: string, contentType: ContentType): string {
    return `${API_BASE}/ContentMedia/${id}?contentType=${contentType}`;
}

export const contentMediaService = {
    async uploadImage(contentType: ContentType, file: File): Promise<string> {
        const formData = new FormData();
        formData.append('file', file);

        const { data } = await api.post<ReturnResult<MediaDTO>>('/ContentMedia/upload-image', formData, {
            params: { contentType },
            headers: { 'Content-Type': 'multipart/form-data' },
            suppressToast: true
        });

        if (!data.result?.id) throw new Error(data.message || 'Upload failed');
        return data.result.id;
    },

    async initVideoUpload(contentType: ContentType, dto: { fileName: string; hashFile: string }): Promise<ContentInitUploadVideoDTO> {
        const { data } = await api.post<ReturnResult<ContentInitUploadVideoDTO>>('/ContentMedia/init-video-upload', dto, {
            params: { contentType },
            suppressToast: true
        });

        if (!data.result) throw new Error(data.message || 'Init video upload failed');
        return data.result;
    },

    async uploadVideoChunk(contentType: ContentType, dto: UploadVideoChunkDTO): Promise<VideoChunkProgressDTO> {
        const formData = new FormData();
        formData.append('sessionId', dto.sessionId);
        formData.append('chunkIndex', dto.chunkIndex.toString());
        formData.append('totalChunks', dto.totalChunks.toString());
        formData.append('chunk', dto.chunk);

        const { data } = await api.post<ReturnResult<VideoChunkProgressDTO>>('/ContentMedia/upload-video-chunk', formData, {
            params: { contentType },
            headers: { 'Content-Type': 'multipart/form-data' },
            suppressToast: true
        });

        if (!data.result) throw new Error(data.message || 'Chunk upload failed');
        return data.result;
    },

    async mergeVideoChunks(contentType: ContentType, dto: MergeVideoChunkDTO): Promise<string> {
        const { data } = await api.post<ReturnResult<MediaDTO>>('/ContentMedia/merge-video-chunks', dto, {
            params: { contentType },
            suppressToast: true
        });

        if (!data.result?.id) throw new Error(data.message || 'Merge failed');
        return data.result.id;
    }
};
