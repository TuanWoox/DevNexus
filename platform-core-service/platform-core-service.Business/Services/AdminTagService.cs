using Microsoft.EntityFrameworkCore;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Tag;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;

namespace platform_core_service.Business.Services
{
    public class AdminTagService : IAdminTagService
    {
        private readonly ApplicationDbContext _context;

        public AdminTagService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ReturnResult<PagedData<SelectTagDTO, string>>> GetPagingAsync(Page<string> page)
        {
            var result = new ReturnResult<PagedData<SelectTagDTO, string>>();
            try
            {
                var query = _context.Tags
                    .Where(t => !t.Deleted)
                    .AsNoTracking()
                    .AsQueryable();

                page.FormatFilter(ref query);
                page.FormatOrder(ref query);

                var totalElements = await query.CountAsync();
                var pagedQuery = query;

                if (page.Size != -1)
                {
                    pagedQuery = pagedQuery
                        .Skip(page.PageNumber * page.Size)
                        .Take(page.Size);
                }

                var tags = await pagedQuery.ToListAsync();

                var tagIds = tags.Select(t => t.Id).ToList();
                var postCounts = await _context.PostTags
                    .Where(pt => tagIds.Contains(pt.TagId))
                    .GroupBy(pt => pt.TagId)
                    .Select(g => new { TagId = g.Key, Count = g.Count() })
                    .ToDictionaryAsync(x => x.TagId, x => x.Count);

                result.Result = new PagedData<SelectTagDTO, string>(page)
                {
                    Data = tags.Select(t => new SelectTagDTO
                    {
                        Id = t.Id,
                        Name = t.Name,
                        PostCount = postCounts.TryGetValue(t.Id, out var count) ? count : 0
                    }).ToList()
                };
                result.Result.Page.TotalElements = totalElements;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while retrieving tags: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<SelectTagDTO>> CreateAsync(CreateTagDTO dto)
        {
            var result = new ReturnResult<SelectTagDTO>();
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.Name))
                {
                    result.Message = "Tag name is required";
                    return result;
                }

                var exists = await _context.Tags
                    .AnyAsync(t => t.Name == dto.Name && !t.Deleted);
                if (exists)
                {
                    result.Message = $"Tag '{dto.Name}' already exists";
                    return result;
                }

                var tag = new Tag { Name = dto.Name };
                _context.Tags.Add(tag);
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug($"[AdminTag] Tag '{tag.Name}' created with Id {tag.Id}");
                result.Result = new SelectTagDTO { Id = tag.Id, Name = tag.Name, PostCount = 0 };
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while creating tag: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> UpdateAsync(UpdateTagDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.Id) || string.IsNullOrWhiteSpace(dto?.Name))
                {
                    result.Message = "Tag Id and Name are required";
                    return result;
                }

                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == dto.Id && !t.Deleted);
                if (tag == null)
                {
                    result.Message = $"Tag {dto.Id} not found";
                    return result;
                }

                var nameConflict = await _context.Tags
                    .AnyAsync(t => t.Name == dto.Name && t.Id != dto.Id && !t.Deleted);
                if (nameConflict)
                {
                    result.Message = $"Tag name '{dto.Name}' is already in use";
                    return result;
                }

                tag.Name = dto.Name;
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug($"[AdminTag] Tag {dto.Id} renamed to '{dto.Name}'");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while updating tag: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> DeleteAsync(string tagId)
        {
            var result = new ReturnResult<bool>();
            try
            {
                var tag = await _context.Tags.FirstOrDefaultAsync(t => t.Id == tagId && !t.Deleted);
                if (tag == null)
                {
                    result.Message = $"Tag {tagId} not found";
                    return result;
                }

                var inUse = await _context.PostTags.AnyAsync(pt => pt.TagId == tagId);
                if (inUse)
                {
                    result.Message = $"Tag '{tag.Name}' is in use and cannot be deleted";
                    return result;
                }

                tag.Deleted = true;
                tag.DateDeleted = DateTimeOffset.UtcNow;
                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug($"[AdminTag] Tag {tagId} soft-deleted");
                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while deleting tag: {ex.Message}";
            }
            return result;
        }

        public async Task<ReturnResult<bool>> MergeAsync(MergeTagsDTO dto)
        {
            var result = new ReturnResult<bool>();
            try
            {
                if (string.IsNullOrWhiteSpace(dto?.SourceTagId) || string.IsNullOrWhiteSpace(dto?.TargetTagId))
                {
                    result.Message = "SourceTagId and TargetTagId are required";
                    return result;
                }

                if (dto.SourceTagId == dto.TargetTagId)
                {
                    result.Message = "Source and target tags must be different";
                    return result;
                }

                var source = await _context.Tags.FirstOrDefaultAsync(t => t.Id == dto.SourceTagId && !t.Deleted);
                if (source == null)
                {
                    result.Message = $"Source tag {dto.SourceTagId} not found";
                    return result;
                }

                var targetExists = await _context.Tags.AnyAsync(t => t.Id == dto.TargetTagId && !t.Deleted);
                if (!targetExists)
                {
                    result.Message = $"Target tag {dto.TargetTagId} not found";
                    return result;
                }

                var sourcePostTags = await _context.PostTags
                    .Where(pt => pt.TagId == dto.SourceTagId)
                    .ToListAsync();

                var targetPostIds = await _context.PostTags
                    .Where(pt => pt.TagId == dto.TargetTagId)
                    .Select(pt => pt.PostId)
                    .ToHashSetAsync();

                var toReassign = sourcePostTags.Where(pt => !targetPostIds.Contains(pt.PostId)).ToList();
                var toDrop = sourcePostTags.Where(pt => targetPostIds.Contains(pt.PostId)).ToList();

                foreach (var pt in toReassign)
                    pt.TagId = dto.TargetTagId;

                _context.PostTags.RemoveRange(toDrop);

                source.Deleted = true;
                source.DateDeleted = DateTimeOffset.UtcNow;

                await _context.SaveChangesAsync();

                DevNexusLogger.Instance.Debug(
                    $"[AdminTag] Merged tag {dto.SourceTagId} into {dto.TargetTagId}: " +
                    $"{toReassign.Count} reassigned, {toDrop.Count} duplicates dropped");

                result.Result = true;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex.Message);
                result.Message = $"An error occurred while merging tags: {ex.Message}";
            }
            return result;
        }
    }
}
