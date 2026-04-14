import { SelectPostDTO } from "../post/select-post-dto";

export interface SelectQAPostDTO extends SelectPostDTO {
    answerCount: number;
}