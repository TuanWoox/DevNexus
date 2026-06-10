using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;

namespace platform_core_service.Business.Mappings
{
    public class AnswerProfile : AutoMapper.Profile
    {
        public AnswerProfile()
        {
            CreateMap<CreateAnswerDTO, Answer>();
            CreateMap<UpdateAnswerDTO, Answer>()
                 .ForMember(dest => dest.Id, opt => opt.Ignore());
            CreateMap<Answer, SelectAnswerDTO>()
                .ForMember(dest => dest.IsSystemAnswer,
                    opt => opt.MapFrom(src => src.Author != null && src.Author.IsSystemProfile))
                .ForMember(dest => dest.Author,
                    opt => opt.MapFrom(src => src.Author));

            // Profile -> SelectAnswerAuthorDTO
            CreateMap<ProfileEntity, SelectAnswerAuthorDTO>();
        }
    }
}
