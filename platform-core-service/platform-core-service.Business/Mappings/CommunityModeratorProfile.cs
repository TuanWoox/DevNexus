using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityModerator;
using CommunityModeratorEntity = platform_core_service.Common.Entities.DbEntities.CommunityModerator;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;

namespace platform_core_service.Business.Mappings
{
    public class CommunityModeratorProfile : Profile
    {
        public CommunityModeratorProfile()
        {
            // Profile entity -> slim embedded DTO (breaks circular reference)
            CreateMap<ProfileEntity, ModeratorProfileDTO>();

            // CreateCommunityModeratorDTO -> CommunityModerator entity
            CreateMap<CreateCommunityModeratorDTO, CommunityModeratorEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());

            // CommunityModerator entity -> SelectCommunityModeratorDTO
            // Maps the Moderator nav prop (Profile) to the embedded ModeratorProfileDTO
            CreateMap<CommunityModeratorEntity, SelectCommunityModeratorDTO>()
                .ForMember(dest => dest.ModeratorProfile, opt => opt.MapFrom(src => src.Moderator));
        }
    }
}
