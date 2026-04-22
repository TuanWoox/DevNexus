namespace platform_core_service.Common.Models.DTOs.EntityDTO.Moderation
{
    /// <summary>
    /// Response returned by POST /internal/moderation/queue.
    /// AI Worker reads the "id" field to store as its queue_entry_id.
    /// </summary>
    public class ModerationQueueResponseDTO
    {
        /// <summary>
        /// The generated ID of the new ModerationQueueEntry row.
        /// AI Worker Python code reads: data.get("id")
        /// </summary>
        public string Id { get; set; } = null!;
    }
}
