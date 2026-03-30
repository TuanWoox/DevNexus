using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.UserFollow;
using platform_core_service.Common.Models.DTOs.MessageBusDTO;

namespace platform_core_service.Business.Mappings
{
    public class UserFollowProfile : AutoMapper.Profile
    {
        public UserFollowProfile()
        {
            CreateMap<UserFollow, SelectUserFollow>();
            CreateMap<CreateUserFollow, UserFollow>();
            CreateMap<UserFollow, UserFollowPublishDTO>();
        }
    }
}