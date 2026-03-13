using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Business.Mappings
{
    public class SettingProfile : Profile
    {
        public SettingProfile()
        {
            CreateMap<CreateSettingDTO, Setting>();
            CreateMap<Setting, SelectSettingDTO>()
                .ForMember(dest => dest.Value, opt =>
                    opt.MapFrom(src => src.IsSensitive ? "*******" : src.Value));
            CreateMap<UpdateSettingDTO, Setting>()
                .ForMember(dest => dest.Id, opt => opt.Ignore());
        }
    }
}
