using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Comment;
using CommentEntity = platform_core_service.Common.Entities.DbEntities.Comment;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;

namespace platform_core_service.Business.Mappings
{
    public class CommentProfile : Profile
    {
        public CommentProfile()
        {
            // CreateCommentDTO -> Comment
            CreateMap<CreateCommentDTO, CommentEntity>();

            // UpdateCommentDTO -> Comment
            CreateMap<UpdateCommentDTO, CommentEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.AuthorId, opt => opt.Ignore())
                .ForMember(dest => dest.PostId, opt => opt.Ignore())
                .ForMember(dest => dest.AnswerId, opt => opt.Ignore())
                .ForMember(dest => dest.ReplyToCommentId, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.Ignore());

            // Comment -> SelectCommentDTO
            CreateMap<CommentEntity, SelectCommentDTO>()
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => src.Author))
                .ForMember(dest => dest.Replies,
                    opt => opt.MapFrom(src => src.Replies));

            // Profile -> SelectCommentAuthorDTO
            CreateMap<ProfileEntity, SelectCommentAuthorDTO>();
        }
    }
}
