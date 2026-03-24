using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMarkedItem;

namespace platform_core_service.Business.Mappings
{
    public class BookMarkedItemProfile : AutoMapper.Profile
    {
        public BookMarkedItemProfile()
        {
            CreateMap<BookMarkedItem, SelectBookMarkedItem>();
            CreateMap<CreateBookMarkedItem, BookMarkedItem>();
        }
    }
}
