import { PostType } from "./create-post-dto";

export interface UpdatePostDTO {
    id: string;             // Bắt buộc phải có Id để biết update bài nào
    title?: string;
    content?: string;
    postType?: PostType;
    slug?: string;
    tagNames?: string[];
}