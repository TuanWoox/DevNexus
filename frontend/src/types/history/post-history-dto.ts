import { SelectPostDTO } from "@/types/post/select-post-dto";

export interface PostHistoryDTO {
    id: string;
    postId: string;
    content: SelectPostDTO;
    dateCreated: string;
}
