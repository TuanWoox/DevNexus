using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Answer;
using platform_core_service.Common.Models.DTOs.EntityDTO.Post;
using platform_core_service.Common.Models.DTOs.EntityDTO.QAPost;

namespace platform_core_service.Business.Mappings
{
    public class AnswerProfile : AutoMapper.Profile
    {
        public AnswerProfile()
        {
            CreateMap<CreateAnswerDTO, Answer>();
            CreateMap<UpdateAnswerDTO, Answer>();
            CreateMap<Answer, SelectAnswerDTO>();
        }
    }
}
