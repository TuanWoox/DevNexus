using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileBlock;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;

namespace platform_core_service.Business.Mappings
{
    public class ProfileBlockProfile : AutoMapper.Profile
    {
        public ProfileBlockProfile()
        {
            CreateMap<ProfileBlock, SelectProfileBlock>()
                .ForMember(dest => dest.BlockedProfile,
                    opt => opt.MapFrom(src => src.BlockedProfile));

            CreateMap<CreateProfileBlock, ProfileBlock>();
            CreateMap<ProfileBlock, ProfileBlockPublishDTO>();
            CreateMap<ProfileBlock, ProfileBlockSyncDTO>();
        }
    }
}