namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    public class AIEmbeddingRequestDTO
    {
        public string Text { get; set; } = null!;
    }

    public class AIEmbeddingResponseDTO
    {
        public List<float> Embedding { get; set; } = [];
    }
}
