using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityAnswersReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityCommentsReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityPostsReport;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityQAPostReports;
using ProfileEntity = platform_core_service.Common.Entities.DbEntities.Profile;

namespace platform_core_service.Business.Mappings
{
    public class CommunityContentReportProfile : AutoMapper.Profile
    {
        public CommunityContentReportProfile()
        {
            CreateMap<Community, SelectCommunityReportCommunityDTO>();
            CreateMap<ProfileEntity, SelectCommunityReportProfileDTO>();

            CreateMap<Post, SelectReportedPostDTO>()
                .ForMember(dest => dest.ContentPreview,
                    opt => opt.MapFrom(src => ToPreview(src.Content)));

            CreateMap<QAPost, SelectReportedQAPostDTO>()
                .IncludeBase<Post, SelectReportedPostDTO>();

            CreateMap<Answer, SelectReportedAnswerDTO>()
                .ForMember(dest => dest.ContentPreview,
                    opt => opt.MapFrom(src => ToPreview(src.Content)))
                .ForMember(dest => dest.QAPostTitle,
                    opt => opt.MapFrom(src => src.QAPost.Title));

            CreateMap<Comment, SelectReportedCommentDTO>()
                .ForMember(dest => dest.ContentPreview,
                    opt => opt.MapFrom(src => ToPreview(src.Content)))
                .ForMember(dest => dest.PostTitle,
                    opt => opt.MapFrom(src => src.Post != null ? src.Post.Title : null))
                .ForMember(dest => dest.QAPostId,
                    opt => opt.MapFrom(src => src.Answer != null ? src.Answer.QAPostId : null))
                .ForMember(dest => dest.QAPostTitle,
                    opt => opt.MapFrom(src => src.Answer != null ? src.Answer.QAPost.Title : null));

            CreateMap<CommunityPostsReport, SelectCommunityPostsReportDTO>();
            CreateMap<CommunityQAPostReports, SelectCommunityQAPostReportsDTO>();
            CreateMap<CommunityAnswersReport, SelectCommunityAnswersReportDTO>();
            CreateMap<CommunityCommentsReport, SelectCommunityCommentsReportDTO>();
        }

        private static string ToPreview(string? content)
        {
            if (string.IsNullOrEmpty(content))
            {
                return string.Empty;
            }

            const int maxLength = 300;
            return content.Length <= maxLength ? content : content.Substring(0, maxLength);
        }
    }
}
