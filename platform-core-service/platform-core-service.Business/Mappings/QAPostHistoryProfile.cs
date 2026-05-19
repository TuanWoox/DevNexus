using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPostHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using System.Text.Json;

namespace platform_core_service.Business.Mappings
{
    public class QAPostHistoryProfile : AutoMapper.Profile
    {
        public QAPostHistoryProfile()
        {
            CreateMap<QAPostHistory, QAPostHistoryDTO>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src =>
                    JsonSerializer.Deserialize<SelectQAPostDTO>(src.ContentSnapshot, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })));
        }
    }
}
