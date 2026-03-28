using AutoMapper;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;

namespace platform_core_service.Business.Mappings
{
    public class ProfileProfile : global::AutoMapper.Profile
    {
        public ProfileProfile()
        {
            CreateMap<CreateProfileDTO, ProfileEntity>();
            CreateMap<UpdateProfileDTO, ProfileEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ApplicationUserId, opt => opt.Ignore());
            CreateMap<ProfileEntity, SelectProfileDTO>();
            CreateMap<ProfileEntity, ProfilePublishDTO>();
        }
    }
}
