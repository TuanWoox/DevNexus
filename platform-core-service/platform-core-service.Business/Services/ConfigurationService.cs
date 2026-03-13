using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using platform_core_service.Business.Repository;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Helper;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.Setting;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Models.Paging;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace platform_core_service.Business.Services
{
    public class ConfigurationService : IConfigurationService
    {
        private readonly ApplicationDbContext _context;
        private readonly IDistributedCache _cache;
        private readonly IRepository<Setting, string> _repo;
        private readonly IMapper _mapper;
        private const string CACHE_KEY = "Global_AppConfiguration";

        public ConfigurationService(ApplicationDbContext context, IDistributedCache cache, IRepository<Setting, string> repository, IMapper mapper)
        {
            _context = context;
            _cache = cache;
            _repo = repository;
            _mapper = mapper;
        }

        public async Task<AppConfiguration> GetConfigAsync()
        {
            var cachedJson = await _cache.GetStringAsync(CACHE_KEY);
            if (!string.IsNullOrEmpty(cachedJson))
            {
                return JsonSerializer.Deserialize<AppConfiguration>(cachedJson) ?? new AppConfiguration();
            }

            var dbSettings = await _context.Settings.ToListAsync();
            var dict = dbSettings.ToDictionary(x => x.Key, x => x.Value);

            var config = new AppConfiguration
            {
                GeminiApiKey = dict.GetValueOrDefault("AI:GeminiApiKey") ?? "",
                BannedKeywords = ParseJsonArray(dict.GetValueOrDefault("Moderation:BannedKeywords")),
            };

            var options = new DistributedCacheEntryOptions()
                .SetAbsoluteExpiration(TimeSpan.FromDays(7));

            await _cache.SetStringAsync(CACHE_KEY, JsonSerializer.Serialize(config), options);

            return config;
        }

        public async Task<ReturnResult<bool>> CreateSettingAsync(CreateSettingDTO createDto)
        {
            var rs = new ReturnResult<bool>();
            try
            {
                var isExist = await _context.Settings.AnyAsync(s => s.Key == createDto.Key);
                if (isExist)
                {
                    rs.Result = false;
                    rs.Message = string.Format(ResponseMessage.MESSAGE_ITEM_EXIST, "Setting Key");
                    return rs;
                }

                var newSetting = _mapper.Map<Setting>(createDto);

                newSetting.Id = Guid.NewGuid().ToString();

                await _context.Settings.AddAsync(newSetting);

                rs.Result = await _context.SaveChangesAsync() > 0;
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
                rs.Result = false;
                rs.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
            }
            return rs;
        }

        public async Task<ReturnResult<bool>> UpdateSettingAsync(UpdateSettingDTO updateDto)
        {
            var rs = new ReturnResult<bool>();
            try
            {

                var existingSetting = await _context.Settings.FindAsync(updateDto.Id);
                if (existingSetting == null)
                {
                    rs.Result = false;
                    rs.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_FOUND, "Setting", updateDto.Id);
                    return rs;
                }
                _mapper.Map(updateDto, existingSetting);
                rs.Result = await _context.SaveChangesAsync() > 0;
                if (rs.Result)
                {
                    await _cache.RemoveAsync(CACHE_KEY);
                }
            }
            catch (Exception ex)
            {
                rs.Result = false;
                DevNexusLogger.Instance.Error(ex);
            }

            return rs;
        }

        public async Task<ReturnResult<PagedData<SelectSettingDTO, string>>> GetPaging(Page<string> page)
        {
            var rs = new ReturnResult<PagedData<SelectSettingDTO, string>>();
            try
            {
                var query = _context.Settings.Where(s => s.Deleted != true).AsQueryable();
                rs.Result = await _repo.GetPagingAsync<Page<string>, SelectSettingDTO>(query, page);
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return rs;
        }
        public async Task<ReturnResult<bool>> DeleteSettingsAsync(List<string> ids)
        {
            var rs = new ReturnResult<bool>();
            try
            {
                var entitiesToDelete = await _context.Settings.Where(s => ids.Contains(s.Id)).ToListAsync();

                if(!entitiesToDelete.Any())
                {
                    rs.Result = false;
                    rs.Message = ResponseMessage.MESSAGE_ALL_ITEM_NOT_FOUND;
                    return rs;
                }

                _context.Settings.RemoveRange(entitiesToDelete);
                await _context.SaveChangesAsync();
                rs.Result = true;
            }
            catch (Exception ex)
            {
                rs.Result = false;
                DevNexusLogger.Instance.Error(ex);
            }
            return rs;
        }

        private List<string> ParseJsonArray(string? json)
        {
            if (string.IsNullOrEmpty(json)) return new List<string>();
            try { return JsonSerializer.Deserialize<List<string>>(json) ?? new List<string>(); }
            catch { return new List<string>(); }
        }
    }
}
