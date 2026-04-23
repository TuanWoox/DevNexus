export interface SelectAnswerAuthorDTO {
    id: string;
    fullName: string;
    avatarUrl?: string;
}

export interface SelectAnswerDTO {
    id: string;
    content: string;
    isAccepted: boolean;
    upvoteCount: number;
    downvoteCount: number;
    qaPostId: string;
    authorId: string;
    author?: SelectAnswerAuthorDTO;
    dateCreated: string;
    dateModified?: string;
}