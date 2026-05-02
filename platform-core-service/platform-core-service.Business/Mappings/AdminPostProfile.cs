using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Mappings
{
    public class AdminPostProfile : AutoMapper.Profile
    {
        public AdminPostProfile()
        {
            // Post -> AdminPostDTO
            // ContentPreview is truncated to 500 chars for list performance.
            // AuthorName resolved from Author nav property.
            CreateMap<PostEntity, AdminPostDTO>()
                .ForMember(dest => dest.ContentPreview,
                    opt => opt.MapFrom(src =>
                        src.Content.Length > 500
                            ? src.Content.Substring(0, 500)
                            : src.Content))
                .ForMember(dest => dest.AuthorName,
                    opt => opt.MapFrom(src =>
                        src.Author != null ? src.Author.FullName : null));
        }
    }
}
