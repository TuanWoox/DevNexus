import { ContentMediaType } from './content-media-type'

export interface SelectQAMediaDTO {
    id: string
    sha256Hash: string
    qaPostId?: string
    qaMediaType: ContentMediaType
    dateCreated?: string
    dateModified?: string
}
