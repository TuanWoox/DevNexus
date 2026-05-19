using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentHistory;
using System.Text.Json;

namespace platform_core_service.Business.Mappings
{
    public class CommentHistoryProfile : AutoMapper.Profile
    {
        public CommentHistoryProfile()
        {
            CreateMap<CommentHistory, CommentHistoryDTO>()
                .ForMember(dest => dest.Content, opt => opt.MapFrom(src =>
                    JsonSerializer.Deserialize<SelectCommentDTO>(src.ContentSnapshot, new JsonSerializerOptions { PropertyNameCaseInsensitive = true })));
        }
    }
}
