import { PostType } from "./create-post-dto";

export interface SelectPostDTO {
    id: string;
    title: string;
    content: string;
    slug: string;
    postType: PostType;
    authorId: string;
    upvoteCount: number;
    downvoteCount: number;
    tagNames: string[];
    dateCreated: string;    // Hoặc Date
    dateModified?: string;  // Có dấu ? vì là DateTimeOffset?
}