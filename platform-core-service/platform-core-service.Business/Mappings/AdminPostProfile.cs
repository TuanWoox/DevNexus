using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;
using QaPostEntity = platform_core_service.Common.Entities.DbEntities.QAPost;

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
                .ForMember(dest => dest.EntityType,
                    opt => opt.MapFrom(src => src is QaPostEntity ? "QA Post" : "Post"))
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => src.Author));
            
            CreateMap<PostModerationResult, AdminQueueEntryDTO>()
                .ForMember(dest => dest.PostTitle,
                    opt => opt.MapFrom(src => src.TargetType.ToString()))
                .ForMember(dest => dest.PostContent,
                    opt => opt.MapFrom(src => src.Reasoning ?? string.Empty))
                .ForMember(dest => dest.AuthorId,
                    opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => null as platform_core_service.Common.Entities.DbEntities.Profile))
                .ForMember(dest => dest.EntityType,
                    opt => opt.MapFrom(src => src.TargetType.ToString()));
        }
    }
}
