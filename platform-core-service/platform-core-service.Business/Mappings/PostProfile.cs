using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using PostEntity = platform_core_service.Common.Entities.DbEntities.Post;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;
using CommunityEntity = platform_core_service.Common.Entities.DbEntities.Community;

namespace platform_core_service.Business.Mappings
{
    public class PostProfile : Profile
    {
        public PostProfile()
        {
            // CreatePostDTO -> Post
            CreateMap<CreatePostDTO, PostEntity>()
                .ForMember(dest => dest.PostTags, opt => opt.Ignore()); // Tags handled in service

            CreateMap<CreatePostShareDTO, PostEntity>()
                .ForMember(dest => dest.PostTags, opt => opt.Ignore())
                .ForMember(dest => dest.SharedPost, opt => opt.Ignore());

            // UpdatePostDTO -> Post
            CreateMap<UpdatePostDTO, PostEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.AuthorId, opt => opt.Ignore())
                .ForMember(dest => dest.PostTags, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.Ignore())
                .ForAllMembers(opt => opt.Condition((src, dest, srcMember) => srcMember != null));

            // Post -> SelectPostDTO
            CreateMap<PostEntity, SelectPostDTO>()
                .ForMember(dest => dest.TagNames,
                    opt => opt.MapFrom(src => src.PostTags.Select(pt => pt.Tag.Name).ToList()))
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => src.Author))
                .ForMember(dest => dest.Community,
                    opt => opt.MapFrom(src => src.Community))
                .ForMember(dest => dest.SharedPost,
                    opt => opt.Ignore());

            // Profile -> SelectPostAuthorDTO
            CreateMap<ProfileEntity, SelectPostAuthorDTO>();

            // Community -> SelectPostCommunityDTO
            CreateMap<CommunityEntity, SelectPostCommunityDTO>();

            CreateMap<PostEntity, SelectPartialPost>();
        }
    }
}
