using AutoMapper;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Models.DTOs.EntityDTO.BookMark;

namespace platform_core_service.Business.Mappings
{
    public class BookMarkProfile : AutoMapper.Profile
    {
        public BookMarkProfile()
        {
            CreateMap<BookMark, SelectBookMark>();
            CreateMap<CreateBookMark, BookMark>();
        }
    }
}
