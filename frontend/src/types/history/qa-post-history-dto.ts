import { SelectQAPostDTO } from "@/types/qa-post/select-qa-post-dto";

export interface QAPostHistoryDTO {
    id: string;
    qaPostId: string;
    content: SelectQAPostDTO;
    dateCreated: string;
}
