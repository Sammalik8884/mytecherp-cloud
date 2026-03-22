using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MytechERP.Application.DTOs.Sync
{
    // Pull Request/Response
    public class SyncPullRequestDto
    {
        public DateTime? LastSyncAt { get; set; }
        public List<string> EntityTypes { get; set; } = new List<string>();
    }

    public class SyncPullResponseDto
    {
        public DateTime ServerSyncTime { get; set; }
        public Dictionary<string, List<SyncEntityDataDto>> Data { get; set; } = new Dictionary<string, List<SyncEntityDataDto>>();
    }

    public class SyncEntityDataDto
    {
        public int Id { get; set; }
        public DateTime UpdatedAt { get; set; }
        public bool IsDeleted { get; set; }
        public object Payload { get; set; }
    }

    // Push Request
    public class SyncPushRequestDto
    {
        public List<SyncPushItemDto> Changes { get; set; } = new List<SyncPushItemDto>();
    }

    public class SyncPushItemDto
    {
        public string EntityType { get; set; }
        public Guid LocalMobileId { get; set; }
        public int? ServerId { get; set; }
        [JsonConverter(typeof(JsonStringEnumConverter))]
        public SyncOperation Operation { get; set; }
        public DateTime MobileUpdatedAt { get; set; }
        public JsonElement Payload { get; set; }
    }

    public enum SyncOperation
    {
        Create,
        Update,
        Delete
    }

    // Push Response
    public class SyncPushResponseDto
    {
        public List<SyncSuccessDto> Processed { get; set; } = new List<SyncSuccessDto>();
        public List<SyncConflictDto> Conflicts { get; set; } = new List<SyncConflictDto>();
        public List<SyncErrorDto> Errors { get; set; } = new List<SyncErrorDto>();
    }

    public class SyncSuccessDto
    {
        public Guid LocalMobileId { get; set; }
        public int ServerId { get; set; }
        public DateTime UpdatedAt { get; set; }
    }

    public class SyncConflictDto
    {
        public Guid LocalMobileId { get; set; }
        public int ServerId { get; set; }
        public object? ServerPayload { get; set; }
        public DateTime ServerUpdatedAt { get; set; }
    }

    public class SyncErrorDto
    {
        public Guid LocalMobileId { get; set; }
        public string? ErrorMessage { get; set; }
    }
}
