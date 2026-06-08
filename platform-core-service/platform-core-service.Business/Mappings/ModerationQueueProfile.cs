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
                    opt => opt.MapFrom(src => src.TargetType.ToString()))
                .ForMember(dest => dest.PostContent,
                    opt => opt.MapFrom(src => src.Tier2Reasoning))
                .ForMember(dest => dest.AuthorId,
                    opt => opt.MapFrom(src => string.Empty))
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => null as platform_core_service.Common.Entities.DbEntities.Profile))
                .ForMember(dest => dest.EntityType,
                    opt => opt.MapFrom(src => src.TargetType.ToString()))
                .ForMember(dest => dest.CreatedAt,
                    opt => opt.MapFrom(src => src.DateCreated ?? DateTimeOffset.MinValue));
        }
    } 
}
