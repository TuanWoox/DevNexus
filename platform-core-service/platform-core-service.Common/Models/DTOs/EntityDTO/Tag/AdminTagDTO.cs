namespace platform_core_service.Common.Models.DTOs.EntityDTO.Tag
{
    public class SelectTagDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
        public int PostCount { get; set; }
    }

    public class CreateTagDTO
    {
        public string Name { get; set; } = null!;
    }

    public class UpdateTagDTO
    {
        public string Id { get; set; } = null!;
        public string Name { get; set; } = null!;
    }

    public class MergeTagsDTO
    {
        public string SourceTagId { get; set; } = null!;
        public string TargetTagId { get; set; } = null!;
    }
}
