export interface CreatePostDTO {
    title: string;
    content: string;
    postType: PostType;
    slug?: string;
    tagNames: string[];
    communityId?: string;
    mediaIds?: string[];
}

export enum PostType {
    MarkDown = 0,
    WYSIWYG = 1
}
