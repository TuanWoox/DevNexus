using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;
using platform_core_service.Common.Utils.Enums;

namespace platform_core_service.Business.Mappings
{
    public class QAPostProfile : AutoMapper.Profile
    {
        public QAPostProfile()
        {
            CreateMap<CreateQAPostDTO, QAPost>()
                .IncludeBase<CreatePostDTO, Post>();
            CreateMap<CreateQAPostShareDTO, QAPost>()
                .IncludeBase<CreatePostShareDTO, Post>();
            CreateMap<UpdateQAPostDTO, QAPost>()
                .IncludeBase<UpdatePostDTO, Post>();
            CreateMap<QAPost, SelectQAPostDTO>()
                .IncludeBase<Post, SelectPostDTO>()
                .ForMember(dest => dest.AnswerCount,
                    opt => opt.MapFrom(src => src.Answers != null
                        ? src.Answers.Count(a => !a.Deleted && a.ModerationStatus != ModerationStatus.Flagged)
                        : 0));
            CreateMap<QAPost, SelectPartialQA>()
                .IncludeBase<Post, SelectPartialPost>();
        }
    }
}
