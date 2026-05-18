using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerMedia;

namespace platform_core_service.Business.Mappings
{
    public class AnswerMediaMapping : AutoMapper.Profile
    {
        public AnswerMediaMapping()
        {
            CreateMap<AnswerMedia, SelectAnswerMediaDTO>();
        }
    }
}
