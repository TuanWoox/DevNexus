using platform_core_service.Common.Models.DTOs.EntityDTO.Post;

namespace platform_core_service.Common.Models.DTOs.EntityDTO.QAPost
{
    public class CreateQAPostDTO : CreatePostDTO
    {
        // Inherits Title, Content, Slug, TagNames and PostType from CreatePostDTO
        // PostType should ideally be set/overridden to PostType.QAPost in the Service layer
    }
}
