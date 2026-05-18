import { ContentMediaType } from './content-media-type'

export interface SelectAnswerMediaDTO {
    id: string
    sha256Hash: string
    answerId?: string
    answerMediaType: ContentMediaType
    dateCreated?: string
    dateModified?: string
}
