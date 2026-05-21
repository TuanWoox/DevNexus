import { SelectPostDTO } from "../post/select-post-dto"
import { SelectQAPostDTO } from "../qa-post/select-qa-post-dto"

export interface SelectBookmarkedItemDTO {
    id: string,
    bookmarkId: string,
    postId?: string,
    qaPostId?: string
    post?: SelectPostDTO,
    qaPost?: SelectQAPostDTO
    isUnavailable: boolean
    unavailableMessage?: string
}
