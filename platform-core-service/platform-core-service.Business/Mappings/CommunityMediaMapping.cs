using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMedia;

namespace platform_core_service.Business.Mappings
{
    public class CommunityMediaMapping : AutoMapper.Profile
    {
        public CommunityMediaMapping()
        {
            CreateMap<CommunityMedia, SelectCommunityMediaDTO>();
        }
    }
}
