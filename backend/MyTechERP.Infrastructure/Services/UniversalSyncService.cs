using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using MytechERP.Application.DTOs.Sync;
using MytechERP.Application.Interfaces;
using MytechERP.domain.Interfaces;
using MytechERP.Infrastructure.Persistance;
using MyTechERP.Infrastructure.Persistence; // Correct namespace based on previous findings

namespace MyTechERP.Infrastructure.Services
{
    public class UniversalSyncService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICurrentUserService _currentUserService;
        private readonly ISyncNotifier _syncNotifier;

        public UniversalSyncService(ApplicationDbContext context, ICurrentUserService currentUserService, ISyncNotifier syncNotifier)
        {
            _context = context;
            _currentUserService = currentUserService;
            _syncNotifier = syncNotifier;
        }

        public async Task<SyncPullResponseDto> PullDeltaAsync(SyncPullRequestDto request)
        {
            var tenantId = _currentUserService.TenantId;
            if (!tenantId.HasValue)
            {
                throw new UnauthorizedAccessException("Tenant ID is missing.");
            }

            var response = new SyncPullResponseDto
            {
                ServerSyncTime = DateTime.UtcNow,
                Data = new Dictionary<string, List<SyncEntityDataDto>>()
            };

            var syncableTypes = GetSyncableTypes();

            foreach (var entityTypeName in request.EntityTypes)
            {
                if (!syncableTypes.TryGetValue(entityTypeName, out var entityType))
                {
                    continue; // Skip unknown types
                }

                // Use reflection to call GenericPull method
                var method = this.GetType().GetMethod(nameof(PullEntityDelta), BindingFlags.NonPublic | BindingFlags.Instance)
                                 ?.MakeGenericMethod(entityType);

                if (method != null)
                {
                    var task = (Task<List<SyncEntityDataDto>>)method.Invoke(this, new object[] { request.LastSyncAt, tenantId.Value });
                    var data = await task;
                    if (data.Any())
                    {
                        response.Data[entityTypeName] = data;
                    }
                }
            }

            return response;
        }

        public async Task<SyncPushResponseDto> PushBatchAsync(SyncPushRequestDto request)
        {
            var tenantId = _currentUserService.TenantId;
            var userId = _currentUserService.UserId ?? "Unknown";
            var roles = _currentUserService.Role ?? string.Empty;

            if (!tenantId.HasValue)
                throw new UnauthorizedAccessException("Tenant ID is missing.");

            var response = new SyncPushResponseDto();
            var syncableTypes = GetSyncableTypes();
            var idMap = new Dictionary<int, int>(); // offline negative id -> real db id

            var log = new MytechERP.domain.Entities.System.SyncLog
            {
                TenantId = tenantId.Value,
                UserId = userId,
                Role = roles,
                SyncTime = DateTime.UtcNow
            };
            _context.SyncLogs.Add(log);

            using var transaction = await _context.Database.BeginTransactionAsync();

            try
            {
                foreach (var change in request.Changes)
                {
                    if (!syncableTypes.TryGetValue(change.EntityType, out var entityType))
                    {
                        response.Errors.Add(new SyncErrorDto { LocalMobileId = change.LocalMobileId, ErrorMessage = $"Unknown Entity Type: {change.EntityType}" });
                        log.ErrorsEncountered++;
                        continue;
                    }

                    try
                    {
                        var method = this.GetType().GetMethod(nameof(ProcessSingleChange), BindingFlags.NonPublic | BindingFlags.Instance)
                                         ?.MakeGenericMethod(entityType);

                        if (method != null)
                        {
                            var task = (Task)method.Invoke(this, new object[] { change, tenantId.Value, userId, response, idMap, log });
                            await task;
                        }
                    }
                    catch (Exception ex)
                    {
                        response.Errors.Add(new SyncErrorDto { LocalMobileId = change.LocalMobileId, ErrorMessage = $"Error processing item: {ex.InnerException?.Message ?? ex.Message}" });
                        log.ErrorsEncountered++;
                    }
                }

                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                try
                {
                    var updates = response.Processed
                        .GroupBy(x => request.Changes.FirstOrDefault(c => c.LocalMobileId == x.LocalMobileId)?.EntityType)
                        .Where(g => g.Key != null)
                        .ToDictionary(g => g.Key!, g => g.Select(x => x.ServerId).ToList());

                    foreach (var update in updates)
                    {
                         await _syncNotifier.NotifySyncCompletedAsync(update.Key, update.Value);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"SignalR Broadcast Failed: {ex.Message}");
                }
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                response.Errors.Add(new SyncErrorDto { LocalMobileId = Guid.Empty, ErrorMessage = $"Critical Transaction Failure: {ex.Message}" });
                log.ErrorsEncountered++;
            }

            return response;
        }

        // --- Helper Methods using Generics ---

        private async Task<List<SyncEntityDataDto>> PullEntityDelta<T>(DateTime? lastSyncAt, int tenantId) where T : class, ISyncableEntity
        {
            var query = _context.Set<T>().IgnoreQueryFilters().AsQueryable();
            query = query.Where(e => e.TenantId == tenantId && !e.IsDeleted);

            var role = _currentUserService.Role ?? string.Empty;
            if (role == MytechERP.domain.Roles.Roles.Technician)
            {
                if (typeof(T) == typeof(MytechERP.domain.Entities.WorkOrder))
                {
                    var userId = _currentUserService.UserId;
                    query = query.Cast<MytechERP.domain.Entities.WorkOrder>()
                                 .Where(w => w.TechnicianId == userId)
                                 .Cast<T>();
                }
                else if (typeof(T) == typeof(MytechERP.domain.Entities.CRM.Customer) ||
                         typeof(T) == typeof(MytechERP.domain.Entities.Finance.Invoice) ||
                         typeof(T) == typeof(MytechERP.domain.Quotations.Quotation))
                {
                    // Technicians shouldn't sync entire customer/finance databases offline
                    return new List<SyncEntityDataDto>();
                }
            }

            if (lastSyncAt.HasValue)
            {
                query = query.Where(e => e.UpdatedAt > lastSyncAt.Value);
            }

            var entities = await query.AsNoTracking().ToListAsync();
            return entities.Select(e => new SyncEntityDataDto
            {
                Id = e.Id,
                UpdatedAt = e.UpdatedAt,
                IsDeleted = e.IsDeleted,
                Payload = e
            }).ToList();
        }

        private async Task ProcessSingleChange<T>(SyncPushItemDto change, int tenantId, string userId, SyncPushResponseDto response, Dictionary<int, int> idMap, MytechERP.domain.Entities.System.SyncLog log) where T : class, ISyncableEntity
        {
            var dbSet = _context.Set<T>();
            string rawPayload = change.Payload.GetRawText();

            // Dependency Replacement Algorithm
            foreach (var kvp in idMap)
            {
                // Replace matching negative integers (offline IDs) with new positive real IDs
                rawPayload = rawPayload.Replace($":{kvp.Key},", $":{kvp.Value},")
                                       .Replace($": {kvp.Key},", $":{kvp.Value},")
                                       .Replace($":{kvp.Key}}}", $":{kvp.Value}}}")
                                       .Replace($": {kvp.Key}}}", $":{kvp.Value}}}");
            }

            if (change.Operation == SyncOperation.Create)
            {
                var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(rawPayload);
                int offlineId = 0;
                if (dict != null && dict.TryGetValue("Id", out var idElement) && idElement.ValueKind == JsonValueKind.Number)
                {
                    offlineId = idElement.GetInt32();
                }
                else if (dict != null && dict.TryGetValue("id", out var idElementLower) && idElementLower.ValueKind == JsonValueKind.Number)
                {
                    offlineId = idElementLower.GetInt32();
                }

                var entity = JsonSerializer.Deserialize<T>(rawPayload, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (entity == null) throw new InvalidOperationException("Invalid Payload");

                entity.TenantId = tenantId;
                entity.Id = 0; 
                entity.UpdatedAt = DateTime.UtcNow;
                entity.IsDeleted = false;

                dbSet.Add(entity);
                await _context.SaveChangesAsync(); 

                if (offlineId < 0)
                {
                    idMap[offlineId] = entity.Id;
                }

                response.Processed.Add(new SyncSuccessDto
                {
                    LocalMobileId = change.LocalMobileId,
                    ServerId = entity.Id,
                    UpdatedAt = entity.UpdatedAt
                });
                log.ItemsPushed++;
            }
            else if (change.Operation == SyncOperation.Update)
            {
                if (!change.ServerId.HasValue) throw new InvalidOperationException("ServerId required for Update");

                var existing = await dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == change.ServerId.Value && e.TenantId == tenantId);
                if (existing == null)
                {
                    response.Errors.Add(new SyncErrorDto { LocalMobileId = change.LocalMobileId, ErrorMessage = "Entity not found on server." });
                    log.ErrorsEncountered++;
                    return;
                }

                if (existing.UpdatedAt > change.MobileUpdatedAt)
                {
                    var conflict = new MytechERP.domain.Entities.System.SyncConflict
                    {
                        TenantId = tenantId,
                        UserId = userId,
                        EntityType = change.EntityType,
                        ServerId = existing.Id,
                        LocalMobileId = change.LocalMobileId.ToString(),
                        ServerPayloadJson = JsonSerializer.Serialize(existing),
                        ClientPayloadJson = rawPayload,
                        ResolutionStrategy = "ServerWins",
                        IsResolved = true
                    };
                    _context.SyncConflicts.Add(conflict);

                    response.Conflicts.Add(new SyncConflictDto
                    {
                        LocalMobileId = change.LocalMobileId,
                        ServerId = existing.Id,
                        ServerPayload = existing,
                        ServerUpdatedAt = existing.UpdatedAt
                    });
                    log.ConflictsResolved++;
                    return;
                }

                var incoming = JsonSerializer.Deserialize<T>(rawPayload, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (incoming == null) throw new InvalidOperationException("Invalid Payload");

                var entry = _context.Entry(existing);
                entry.CurrentValues.SetValues(incoming);
                
                existing.TenantId = tenantId;
                existing.Id = change.ServerId.Value;
                existing.UpdatedAt = DateTime.UtcNow;

                response.Processed.Add(new SyncSuccessDto
                {
                    LocalMobileId = change.LocalMobileId,
                    ServerId = existing.Id,
                    UpdatedAt = existing.UpdatedAt
                });
                log.ItemsPushed++;
            }
            else if (change.Operation == SyncOperation.Delete)
            {
                if (!change.ServerId.HasValue) throw new InvalidOperationException("ServerId required for Delete");

                var existing = await dbSet.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.Id == change.ServerId.Value && e.TenantId == tenantId);
                if (existing == null)
                {
                    response.Processed.Add(new SyncSuccessDto { LocalMobileId = change.LocalMobileId, ServerId = change.ServerId.Value, UpdatedAt = DateTime.UtcNow });
                    return;
                }

                existing.IsDeleted = true;
                existing.UpdatedAt = DateTime.UtcNow;

                response.Processed.Add(new SyncSuccessDto
                {
                    LocalMobileId = change.LocalMobileId,
                    ServerId = existing.Id,
                    UpdatedAt = existing.UpdatedAt
                });
                log.ItemsPushed++;
            }
        }

        private Dictionary<string, Type> GetSyncableTypes()
        {
            // Scan the assembly containing ISyncableEntity (Domain Layer) for generic implementations
            var domainAssembly = typeof(ISyncableEntity).Assembly;
            return domainAssembly.GetTypes()
                .Where(t => typeof(ISyncableEntity).IsAssignableFrom(t) && !t.IsInterface && !t.IsAbstract)
                .ToDictionary(t => t.Name, t => t);
        }
    }
}
