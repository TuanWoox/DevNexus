using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.PostMedia;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Mappings
{
    public class PostMediaMapping: AutoMapper.Profile
    {
        public PostMediaMapping() {
            CreateMap<PostMedia, SelectPostMediaDTO>();
        }
    }
}
