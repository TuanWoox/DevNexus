export interface CreateAnswerDTO {
    content: string, // Remember to validate with the backend logic
    qaPostId: string
    mediaIds?: string[]
}
