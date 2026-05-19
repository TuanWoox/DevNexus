export interface CreateVideoUploadDTO {
    fileName: string
    hashFile: string
}

export interface ContentInitUploadVideoDTO<TSelectMediaDTO> {
    sessionId: string
    tempPath: string
    isDuplicate: boolean
    existingMedia?: TSelectMediaDTO
}

export interface VideoChunkProgressDTO {
    receivedChunks: number
    totalChunks: number
    isComplete: boolean
}

export interface MergeVideoChunkDTO {
    sessionId: string
    fileName: string
    totalChunks: number
    fileHash: string
}

export interface UploadVideoChunkDTO {
    sessionId: string
    chunkIndex: number
    totalChunks: number
    chunk: File
}
