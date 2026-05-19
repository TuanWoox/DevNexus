using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostHistory;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using System.Text.Json;

namespace platform_core_service.Business.Mappings
{
    public class PostHistoryProfile : AutoMapper.Profile
    {
        public PostHistoryProfile()
        {
            CreateMap<PostHistory, PostHistoryDTO>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src =>
                    JsonSerializer.Deserialize<SelectPostDTO>(src.ContentSnapshot, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })));
        }
    }
}
