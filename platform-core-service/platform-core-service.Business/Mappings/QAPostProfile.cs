using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;

namespace platform_core_service.Business.Mappings
{
    public class QAPostProfile : AutoMapper.Profile
    {
        public QAPostProfile()
        {
            CreateMap<CreateQAPostDTO, QAPost>()
                .IncludeBase<CreatePostDTO, Post>();
            CreateMap<UpdateQAPostDTO, QAPost>()
                .IncludeBase<UpdatePostDTO, Post>();
            CreateMap<QAPost, SelectQAPostDTO>()
                .IncludeBase<Post, SelectPostDTO>()
                .ForMember(dest => dest.AnswerCount, 
                    opt => opt.MapFrom(src => src.Answers != null ? src.Answers.Count : 0));
        }
    }
}
