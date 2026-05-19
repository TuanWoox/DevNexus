import { ContentMediaType } from './content-media-type'

export interface SelectCommentMediaDTO {
    id: string
    sha256Hash: string
    commentId?: string
    commentMediaType: ContentMediaType
    dateCreated?: string
    dateModified?: string
}
