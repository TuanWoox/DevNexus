using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAMedia;
using Profile = AutoMapper.Profile;

namespace platform_core_service.Business.Mappings
{
    public class QAMediaMapping : Profile
    {
        public QAMediaMapping()
        {
            CreateMap<QAMedia, SelectQAMediaDTO>().ReverseMap();
        }
    }
}
