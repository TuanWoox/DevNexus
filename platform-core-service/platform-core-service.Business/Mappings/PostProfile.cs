using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;

namespace platform_core_service.Business.Mappings
{
    public class PostProfile : Profile
    {
        public PostProfile()
        {
            // CreatePostDTO -> Post
            CreateMap<CreatePostDTO, PostEntity>()
                .ForMember(dest => dest.PostTags, opt => opt.Ignore()); // Tags handled in service

            // UpdatePostDTO -> Post
            CreateMap<UpdatePostDTO, PostEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.AuthorId, opt => opt.Ignore())
                .ForMember(dest => dest.PostTags, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.Ignore());

            // Post -> SelectPostDTO
            CreateMap<PostEntity, SelectPostDTO>()
                .ForMember(dest => dest.TagNames,
                    opt => opt.MapFrom(src => src.PostTags.Select(pt => pt.Tag.Name).ToList()));

            CreateMap<PostEntity, SelectPartialPost>();
        }
    }
}
