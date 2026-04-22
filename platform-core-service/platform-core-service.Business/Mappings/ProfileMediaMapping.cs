using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.ProfileMedia;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Mappings
{
    public class ProfileMediaMapping: AutoMapper.Profile
    {
        public ProfileMediaMapping()
        {
            CreateMap<ProfileMedia, SelectProfileMediaDTO>();
        }
    }
}
