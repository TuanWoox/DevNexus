using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommentMedia;

namespace platform_core_service.Business.Mappings
{
    public class CommentMediaMapping : AutoMapper.Profile
    {
        public CommentMediaMapping()
        {
            CreateMap<CommentMedia, SelectCommentMediaDTO>();
        }
    }
}
