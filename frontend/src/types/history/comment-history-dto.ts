import { SelectCommentDTO } from "@/types/comment/select-comment-dto";

export interface CommentHistoryDTO {
    id: string;
    commentId: string;
    content: SelectCommentDTO;
    dateCreated: string;
}
