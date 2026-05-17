using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Admin;

namespace platform_core_service.Business.Mappings
{
    public class AdminAuditLogProfile : AutoMapper.Profile
    {
        public AdminAuditLogProfile()
        {
            CreateMap<AdminAuditLog, AdminAuditLogDTO>();
        }
    }
}
