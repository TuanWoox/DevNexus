using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.FollowRequest;

namespace platform_core_service.Business.Mappings
{
    public class FollowRequestProfile : AutoMapper.Profile
    {
        public FollowRequestProfile()
        {
            CreateMap<FollowRequest, SelectFollowRequest>();
        }
    }
}