export interface SelectAnswerDTO {
    id: string,
    content: string,
    isAccepted: boolean,
    upvoteCount: number,
    downvoteCount: number,
    qaPostId: string,
    authorId: string,
    dateCreated: string,
    dateModified?: string
}