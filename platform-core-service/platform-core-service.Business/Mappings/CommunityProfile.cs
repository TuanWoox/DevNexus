using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.Community;
using CommunityEntity = platform_core_service.Common.Entities.DbEntities.Community;

namespace platform_core_service.Business.Mappings
{
    public class CommunityProfile : Profile
    {
        public CommunityProfile()
        {
            // CreateCommunityDTO -> Community
            CreateMap<CreateCommunityDTO, CommunityEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore());

            // UpdateCommunityDTO -> Community (only map non-null fields)
            CreateMap<UpdateCommunityDTO, CommunityEntity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerId, opt => opt.Ignore())
                .ForMember(dest => dest.DateCreated, opt => opt.Ignore())
                .ForMember(dest => dest.Name, opt => opt.Condition(src => src.Name != null))
                .ForMember(dest => dest.Description, opt => opt.Condition(src => src.Description != null))
                .ForMember(dest => dest.CommunityCoverPhotoUrl, opt => opt.Condition(src => src.CommunityCoverPhotoUrl != null))
                .ForMember(dest => dest.Slug, opt => opt.Condition(src => src.Slug != null))
                .ForMember(dest => dest.IsPrivate, opt =>
                {
                    opt.PreCondition(src => src.IsPrivate.HasValue);
                    opt.MapFrom(src => src.IsPrivate!.Value);
                })
                .ForMember(dest => dest.RequireContentApproval, opt =>
                {
                    opt.PreCondition(src => src.RequireContentApproval.HasValue);
                    opt.MapFrom(src => src.RequireContentApproval!.Value);
                });

            // Community -> SelectCommunityDTO
            CreateMap<CommunityEntity, SelectCommunityDTO>();
        }
    }
}
