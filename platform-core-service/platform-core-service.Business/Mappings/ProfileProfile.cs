using AutoMapper;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;
using platform_core_service.Common.Models.DTOs.EntityDTO.Profile;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;

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
            CreateMap<ProfileEntity, AdminProfileDTO>()
                .ForMember(dest => dest.UserId, opt => opt.MapFrom(src => src.ApplicationUserId))
                .ForMember(dest => dest.DisplayName, opt => opt.MapFrom(src => src.FullName))
                .ForMember(dest => dest.Email, opt => opt.MapFrom(src => src.ApplicationUser.Email))
                .ForMember(dest => dest.Role, opt => opt.MapFrom(src => src.ApplicationUser.UserRoles.FirstOrDefault() != null ? src.ApplicationUser.UserRoles.FirstOrDefault()!.Role.Name : "Developer"))
                .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.DateCreated))
                .ForMember(dest => dest.PostCount, opt => opt.MapFrom(src => src.Posts.Count));
            CreateMap<ProfileEntity, ProfilePublishDTO>();
            CreateMap<ProfileEntity, ProfileSyncDTO>();
        }
    }
}
