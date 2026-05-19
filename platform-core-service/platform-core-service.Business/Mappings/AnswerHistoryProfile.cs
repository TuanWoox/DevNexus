using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.AnswerHistory;
using System.Text.Json;

namespace platform_core_service.Business.Mappings
{
    public class AnswerHistoryProfile : AutoMapper.Profile
    {
        public AnswerHistoryProfile()
        {
            CreateMap<AnswerHistory, AnswerHistoryDTO>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src =>
                    JsonSerializer.Deserialize<SelectAnswerDTO>(src.ContentSnapshot, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })));
        }
    }
}
