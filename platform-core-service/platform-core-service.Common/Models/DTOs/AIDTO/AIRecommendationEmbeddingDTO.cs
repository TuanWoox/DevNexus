namespace platform_core_service.Common.Models.DTOs.AIDTO
{
    public class AIEmbeddingItemDTO
    {
        public string Id { get; set; } = null!;
        public string Text { get; set; } = null!;
    }

    public class AIBatchEmbeddingRequestDTO
    {
        public List<AIEmbeddingItemDTO> Items { get; set; } = [];
    }

    public class AIEmbeddingItemResponseDTO
    {
        public string Id { get; set; } = null!;
        public List<float> Embedding { get; set; } = [];
    }

    public class AIBatchEmbeddingResponseDTO
    {
        public List<AIEmbeddingItemResponseDTO> Items { get; set; } = [];
    }
}
