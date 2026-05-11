using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;
using platform_core_service.Common.Models.DTOs.MicroserviceSyncDTO;

namespace platform_core_service.Business.Mappings
{
    public class UserFollowProfile : AutoMapper.Profile
    {
        public UserFollowProfile()
        {
            CreateMap<UserFollow, SelectUserFollow>();
            CreateMap<CreateUserFollow, UserFollow>();
            CreateMap<UserFollow, UserFollowPublishDTO>();
            CreateMap<UserFollow, UserFollowSyncDTO>(); 
        }
    }
}