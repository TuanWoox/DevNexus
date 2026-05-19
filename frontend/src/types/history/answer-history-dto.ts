import { SelectAnswerDTO } from "@/types/answer/select-answer-dto";

export interface AnswerHistoryDTO {
    id: string;
    answerId: string;
    content: SelectAnswerDTO;
    dateCreated: string;
}
