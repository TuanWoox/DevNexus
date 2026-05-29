import { ContentType } from "../content-media/content-type"

export interface SelectBookmarkDTO {
    id: string,
    name: string,
    ownerId: string,
    dateCreated: string,
    dateModified: string,
    previewImageMediaId?: string | null,
    previewImageContentType?: ContentType | null
}
