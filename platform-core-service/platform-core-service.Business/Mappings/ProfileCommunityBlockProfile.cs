using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileCommunityBlock;
using ProfileCommunityBlockEntity = platform_core_service.Common.Entities.DbEntities.ProfileCommunityBlock;

namespace platform_core_service.Business.Mappings
{
    public class ProfileCommunityBlockProfile : Profile
    {
        public ProfileCommunityBlockProfile()
        {
            CreateMap<ProfileCommunityBlockEntity, SelectProfileCommunityBlock>()
                .ForMember(dest => dest.Community, opt => opt.MapFrom(src => src.Community));

            CreateMap<CreateProfileCommunityBlock, ProfileCommunityBlockEntity>();
        }
    }
}
