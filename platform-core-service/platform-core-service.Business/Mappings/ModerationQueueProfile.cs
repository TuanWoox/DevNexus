using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Moderation;

namespace platform_core_service.Business.Mappings
{
    public class ModerationQueueProfile : AutoMapper.Profile
    {
        public ModerationQueueProfile()
        {
            CreateMap<ModerationQueueEntry, AdminQueueEntryDTO>()
                .ForMember(dest => dest.PostTitle,
                    opt => opt.MapFrom(src => src.Post.Title))
                .ForMember(dest => dest.PostContent,
                    opt => opt.MapFrom(src => src.Post.Content))
                .ForMember(dest => dest.AuthorId,
                    opt => opt.MapFrom(src => src.Post.AuthorId))
                .ForMember(dest => dest.CreatedAt,
                    opt => opt.MapFrom(src => src.DateCreated ?? DateTimeOffset.MinValue));
        }
    } 
}
