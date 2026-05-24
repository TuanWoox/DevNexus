using AutoMapper;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMember;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityMute;
using CommunityMemberEntity = platform_core_service.Common.Entities.DbEntities.CommunityMember;
using CommunityMembershipRequestEntity = platform_core_service.Common.Entities.DbEntities.CommunityMembershipRequest;
using CommunityBanEntity = platform_core_service.Common.Entities.DbEntities.CommunityBan;
using CommunityMuteMemberEntity = platform_core_service.Common.Entities.DbEntities.CommunityMuteMember;

namespace platform_core_service.Business.Mappings
{
    public class CommunityMemberProfile : Profile
    {
        public CommunityMemberProfile()
        {
            // CommunityMember -> SelectCommunityMemberDTO
            // Profile navigation is included via .Include() in service, AutoMapper maps it automatically
            CreateMap<CommunityMemberEntity, SelectCommunityMemberDTO>();

            // CommunityMembershipRequest -> SelectCommunityMembershipRequestDTO
            CreateMap<CommunityMembershipRequestEntity, SelectCommunityMembershipRequestDTO>();

            // CommunityBan -> SelectCommunityBanDTO
            CreateMap<CommunityBanEntity, SelectCommunityBanDTO>();

            // CommunityMuteMember -> SelectCommunityMuteDTO
            CreateMap<CommunityMuteMemberEntity, SelectCommunityMuteDTO>();
        }
    }
}
