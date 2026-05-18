import { ContentMediaType } from './content-media-type'

export interface SelectPostMediaDTO {
    id: string
    sha256Hash: string
    postId?: string
    postMediaType: ContentMediaType
    dateCreated?: string
    dateModified?: string
}
