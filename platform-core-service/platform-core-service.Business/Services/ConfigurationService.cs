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
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Utils.Extensions;
using platform_core_service.Data;
using System.Runtime.InteropServices;
using System.Text.Json;

namespace platform_core_service.Business.Services
{
    public class ConfigurationService : IConfigurationService
    {
        private readonly ApplicationDbContext _context;
        private readonly ICacheService _cacheService;
        private readonly IRepository<Setting, string> _repo;
        private readonly IMapper _mapper;
        private const string CACHE_KEY = "ALL_SETTINGS_CACHE";

        public ConfigurationService(ApplicationDbContext context, ICacheService cacheService, IRepository<Setting, string> repository, IMapper mapper)
        {
            _context = context;
            _cacheService = cacheService;
            _repo = repository;
            _mapper = mapper;
        }

        public async Task<Dictionary<string, string>> GetAllSettingsDynamicAsync()
        {
            var cachedSettings = await _cacheService.GetCacheAsync<Dictionary<string, string>>(CACHE_KEY);
            if (cachedSettings != null)
                return cachedSettings;

            var dict = await _context.Settings.AsNoTracking()
                .ToDictionaryAsync(x => $"{x.Group}:{x.Key}", x => x.Value);

            await _cacheService.SetCacheAsync(CACHE_KEY, dict,
                new DistributedCacheEntryOptions().SetAbsoluteExpiration(TimeSpan.FromDays(7)));

            return dict;
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

                await _context.Settings.AddAsync(newSetting);

                rs.Result = await _context.SaveChangesAsync() > 0;
                if (rs.Result)
                {
                    await _cacheService.RemoveCacheAsync(CACHE_KEY);
                }
            }
            catch (Exception ex)
            {
                rs.Result = false;
                rs.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                DevNexusLogger.Instance.Error(ex);
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
                    await _cacheService.RemoveCacheAsync(CACHE_KEY);
                }
            }
            catch (Exception ex)
            {
                rs.Result = false;
                rs.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                DevNexusLogger.Instance.Error(ex);
            }

            return rs;
        }

        public async Task<ReturnResult<SelectSettingDTO>> GetOneByKeyAndGroup(string key, string group)
        {
            var result = new ReturnResult<SelectSettingDTO>();
            try
            {
                var cleanKey = key?.Trim();
                var cleanGroup = group?.Trim();

                var existing = await _context.Settings
                    .AsNoTracking()
                    .FirstOrDefaultAsync(x => x.Key == cleanKey && x.Group == cleanGroup);

                if (existing != null)
                {
                    result.Result = _mapper.Map<SelectSettingDTO>(existing);
                }
                else
                {
                    result.Message = string.Format(ResponseMessage.MESSAGE_ITEM_NOT_EXIST, $"The setting with key '{cleanKey}' and group '{cleanGroup}'");
                }
            }
            catch (Exception ex)
            {
                result.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
                DevNexusLogger.Instance.Error(ex);
            }
            return result;
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
                rs.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
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

                if (!entitiesToDelete.Any())
                {
                    rs.Result = false;
                    rs.Message = ResponseMessage.MESSAGE_ALL_ITEM_NOT_FOUND;
                    return rs;
                }

            _context.Settings.RemoveRange(entitiesToDelete);
            await _context.SaveChangesAsync();
            await _cacheService.RemoveCacheAsync(CACHE_KEY);
            rs.Result = true;
            }
            catch (Exception ex)
            {
                rs.Result = false;
                rs.Message = ResponseMessage.MESSAGE_TECHNICAL_ISSUE;
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

        public async Task InitSetting()
        {
            List<Setting> defaultSettings = new List<Setting>
            {
                new Setting
                {
                    Key = "PASSWORD_RESET_URL",
                    Group = "FRONT_END",
                    Value = "http://localhost:3000/reset-password",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Base URL for reset password feature"
                },
                new Setting
                {
                    Key = "FORGOT_PASSWORD_EMAIL",
                    Group = "EMAIL_TEMPLATE",
                    Value = @"<!DOCTYPE html>
                    <html lang=""en"">
                    <head>
                        <meta charset=""UTF-8"">
                        <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                        <title>Reset Your Password</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                line-height: 1.6;
                            }
                            .email-wrapper {
                                width: 100%;
                                background-color: #f5f5f5;
                                padding: 20px 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            }
                            .email-header {
                                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                                padding: 40px 20px;
                                text-align: center;
                            }
                            .email-header h1 {
                                color: #ffffff;
                                font-size: 28px;
                                font-weight: 700;
                                letter-spacing: 1px;
                                margin: 0;
                            }
                            .email-header .logo-highlight {
                                color: #007bff;
                            }
                            .email-body {
                                padding: 40px 30px;
                            }
                            .email-body h2 {
                                color: #1a1a1a;
                                font-size: 22px;
                                margin-bottom: 15px;
                                font-weight: 600;
                            }
                            .email-body p {
                                color: #555;
                                margin-bottom: 15px;
                                font-size: 16px;
                            }
                            .button-wrapper {
                                text-align: center;
                                margin: 30px 0;
                            }
                            .reset-button {
                                display: inline-block;
                                background-color: #007bff;
                                color: #ffffff;
                                padding: 16px 40px;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                font-size: 16px;
                                box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
                                transition: background-color 0.3s ease;
                            }
                            .reset-button:hover {
                                background-color: #0056b3;
                            }
                            .email-body .notice {
                                background-color: #f9f9f9;
                                border-left: 4px solid #ffc107;
                                padding: 15px;
                                margin: 25px 0;
                                border-radius: 4px;
                                font-size: 14px;
                                color: #666;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                padding: 25px 30px;
                                text-align: center;
                                border-top: 1px solid #e0e0e0;
                            }
                            .email-footer p {
                                color: #888;
                                font-size: 13px;
                                margin: 5px 0;
                            }
                            .email-footer .copyright {
                                font-size: 12px;
                                color: #999;
                            }
                            .highlight {
                                color: #007bff;
                                font-weight: 600;
                            }
                            .warning-text {
                                color: #d32f2f;
                                font-weight: 500;
                            }
                        </style>
                    </head>
                    <body>
                        <div class=""email-wrapper"">
                            <div class=""email-container"">
                                <!-- Header -->
                                <div class=""email-header"">
                                    <h1>DEV<span class=""logo-highlight"">NEXUS</span></h1>
                                </div>

                                <!-- Body -->
                                <div class=""email-body"">
                                    <h2>Hello {userName},</h2>
                
                                    <p>We received a request to reset the password for your <span class=""highlight"">DevNexus</span> account.</p>
                
                                    <p>To create a new password, click the button below. This link will remain active for <span class=""warning-text"">5 minutes</span> only.</p>

                                    <!-- Button -->
                                    <div class=""button-wrapper"">
                                        <a href=""{resetLink}"" class=""reset-button"" style=""color: #ffffff"">Reset Your Password</a>
                                    </div>

                                    <!-- Notice -->
                                    <div class=""notice"">
                                        <p><strong>Didn't request this?</strong></p>
                                        <p>If you did not request a password reset, you can safely ignore this email. Your password will not change until you access the link above.</p>
                                    </div>

                                    <!-- Security Warning -->
                                    <p style=""color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;"">
                                        <strong>Security Notice:</strong> For your security, this email was sent automatically. Please do not reply to this address or share this email with others.
                                    </p>
                                </div>

                                <!-- Footer -->
                                <div class=""email-footer"">
                                    <p>&copy; {currentYear} DevNexus | The Social Learning Network for Engineers</p>
                                    <p>Innovating the way we learn to code.</p>
                                    <p class=""copyright"">This is an automated message, please do not reply.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Template for password reset email"
                },
                new Setting
                {
                    Key = "REGISTRATION_CONFIRMATION_URL",
                    Group = "FRONT_END",
                    Value = "http://localhost:3000/confirm-email",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Base URL for email confirmation feature"
                },
                new Setting
                {
                    Key = "REGISTRATION_CONFIRMATION_EMAIL",
                    Group = "EMAIL_TEMPLATE",
                    Value = @"<!DOCTYPE html>
                    <html lang=""en"">
                    <head>
                        <meta charset=""UTF-8"">
                        <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
                        <title>Confirm Your Email</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            body {
                                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                                background-color: #f5f5f5;
                                color: #333;
                                line-height: 1.6;
                            }
                            .email-wrapper {
                                width: 100%;
                                background-color: #f5f5f5;
                                padding: 20px 0;
                            }
                            .email-container {
                                max-width: 600px;
                                margin: 0 auto;
                                background-color: #ffffff;
                                border-radius: 8px;
                                overflow: hidden;
                                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                            }
                            .email-header {
                                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                                padding: 40px 20px;
                                text-align: center;
                            }
                            .email-header h1 {
                                color: #ffffff;
                                font-size: 28px;
                                font-weight: 700;
                                letter-spacing: 1px;
                                margin: 0;
                            }
                            .email-header .logo-highlight {
                                color: #007bff;
                            }
                            .email-body {
                                padding: 40px 30px;
                            }
                            .email-body h2 {
                                color: #1a1a1a;
                                font-size: 22px;
                                margin-bottom: 15px;
                                font-weight: 600;
                            }
                            .email-body p {
                                color: #555;
                                margin-bottom: 15px;
                                font-size: 16px;
                            }
                            .button-wrapper {
                                text-align: center;
                                margin: 30px 0;
                            }
                            .confirm-button {
                                display: inline-block;
                                background-color: #007bff;
                                color: #ffffff;
                                padding: 16px 40px;
                                text-decoration: none;
                                border-radius: 6px;
                                font-weight: 600;
                                font-size: 16px;
                                box-shadow: 0 4px 8px rgba(0, 123, 255, 0.3);
                                transition: background-color 0.3s ease;
                            }
                            .confirm-button:hover {
                                background-color: #0056b3;
                            }
                            .email-body .notice {
                                background-color: #f9f9f9;
                                border-left: 4px solid #ffc107;
                                padding: 15px;
                                margin: 25px 0;
                                border-radius: 4px;
                                font-size: 14px;
                                color: #666;
                            }
                            .email-footer {
                                background-color: #f4f4f4;
                                padding: 25px 30px;
                                text-align: center;
                                border-top: 1px solid #e0e0e0;
                            }
                            .email-footer p {
                                color: #888;
                                font-size: 13px;
                                margin: 5px 0;
                            }
                            .email-footer .copyright {
                                font-size: 12px;
                                color: #999;
                            }
                            .highlight {
                                color: #007bff;
                                font-weight: 600;
                            }
                            .warning-text {
                                color: #d32f2f;
                                font-weight: 500;
                            }
                        </style>
                    </head>
                    <body>
                        <div class=""email-wrapper"">
                            <div class=""email-container"">
                                <!-- Header -->
                                <div class=""email-header"">
                                    <h1>DEV<span class=""logo-highlight"">NEXUS</span></h1>
                                </div>
                                <!-- Body -->
                                <div class=""email-body"">
                                    <h2>Welcome, {userName}!</h2>

                                    <p>Thank you for creating a <span class=""highlight"">DevNexus</span> account.</p>

                                    <p>To complete your registration and activate your account, click the button below. This link will remain active for <span class=""warning-text"">24 hours</span> only.</p>
                                    <!-- Button -->
                                    <div class=""button-wrapper"">
                                        <a href=""{confirmationLink}"" class=""confirm-button"" style=""color: #ffffff"">Confirm Your Email</a>
                                    </div>
                                    <!-- Notice -->
                                    <div class=""notice"">
                                        <p><strong>Didn't create an account?</strong></p>
                                        <p>If you did not register for DevNexus, you can safely ignore this email. No account will be activated without clicking the link above.</p>
                                    </div>
                                    <!-- Security Warning -->
                                    <p style=""color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;"">
                                        <strong>Security Notice:</strong> For your security, this email was sent automatically. Please do not reply to this address or share this email with others.
                                    </p>
                                </div>
                                <!-- Footer -->
                                <div class=""email-footer"">
                                    <p>&copy; {currentYear} DevNexus | The Social Learning Network for Engineers</p>
                                    <p>Innovating the way we learn to code.</p>
                                    <p class=""copyright"">This is an automated message, please do not reply.</p>
                                </div>
                            </div>
                        </div>
                    </body>
                    </html>",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Template for registration confirmation email"
                },
                new Setting
                {
                    Key = "UPLOAD_FOLDER",
                    Group = "UPLOAD",
                    Value = RuntimeInformation.IsOSPlatform(OSPlatform.Windows)  ? @"D:\Uploads" : "/var/www/uploads"
                },
                new Setting
                {
                    Key = "ACCOUNT_SUSPENDED_EMAIL",
                    Group = "EMAIL_TEMPLATE",
                    Value = @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Account Temporarily Suspended</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f5f5f5;
            padding: 40px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e0e0e0;
        }
        .email-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 35px 20px;
            text-align: center;
            border-bottom: 3px solid #f59e0b;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin: 0;
        }
        .email-header .logo-highlight {
            color: #007bff;
        }
        .email-body {
            padding: 40px 35px;
        }
        .status-badge {
            display: inline-block;
            background-color: #fffbeb;
            border: 1px solid #fef3c7;
            color: #d97706;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .email-body h2 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .email-body p {
            color: #555;
            margin-bottom: 20px;
            font-size: 15px;
        }
        .details-card {
            background-color: #fafafa;
            border-radius: 8px;
            border: 1px solid #eaeaea;
            padding: 20px;
            margin: 25px 0;
        }
        .detail-row {
            margin-bottom: 12px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 13px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 15px;
            color: #222;
            font-weight: 500;
        }
        .reason-box {
            font-style: italic;
            color: #444;
            background-color: #f3f4f6;
            border-left: 4px solid #f59e0b;
            padding: 12px 16px;
            border-radius: 0 6px 6px 0;
            margin-top: 5px;
        }
        .notice-card {
            background-color: #fffdf5;
            border-left: 4px solid #f59e0b;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .notice-card h3 {
            color: #b45309;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .notice-card p {
            color: #78350f;
            font-size: 14px;
            margin-bottom: 0;
        }
        .notice-card a {
            color: #b45309;
            text-decoration: underline;
            font-weight: 600;
        }
        .email-footer {
            background-color: #fafafa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #eaeaea;
        }
        .email-footer p {
            color: #888;
            font-size: 13px;
            margin: 6px 0;
        }
        .email-footer .copyright {
            font-size: 12px;
            color: #aaa;
            margin-top: 15px;
        }
        .highlight {
            color: #007bff;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class=""email-wrapper"">
        <div class=""email-container"">
            <!-- Header -->
            <div class=""email-header"">
                <h1>DEV<span class=""logo-highlight"">NEXUS</span></h1>
            </div>

            <!-- Body -->
            <div class=""email-body"">
                <span class=""status-badge"">Temporary Suspension</span>
                <h2>Hello {userName},</h2>
                
                <p>We are writing to notify you that your <span class=""highlight"">DevNexus</span> account has been temporarily suspended due to a violation of our platform terms.</p>
                
                <!-- Details -->
                <div class=""details-card"">
                    <div class=""detail-row"">
                        <div class=""detail-label"">Suspended Until</div>
                        <div class=""detail-value"" style=""color: #d97706; font-weight: 600;"">{suspendedUntil}</div>
                    </div>
                    <div class=""detail-row"" style=""margin-top: 15px;"">
                        <div class=""detail-label"">Reason for Action</div>
                        <div class=""reason-box"">{reason}</div>
                    </div>
                </div>

                <p>While suspended, you will not be able to access your profile, post new content, write comments, or interact with other members of the community.</p>

                <!-- Notice -->
                <div class=""notice-card"">
                    <h3>Need help or want to appeal?</h3>
                    <p>Please review our <a href=""http://localhost:3000/guidelines"">Community Guidelines</a> to understand our standards. If you believe this suspension was made in error, you can reply directly to this email or contact support at <a href=""mailto:studynest284@gmail.com"">studynest284@gmail.com</a>.</p>
                </div>

                <p style=""color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;"">
                    <strong>Security Notice:</strong> This is an automated administrative notification regarding your account state.
                </p>
            </div>

            <!-- Footer -->
            <div class=""email-footer"">
                <p>&copy; {currentYear} DevNexus | The Social Learning Network for Engineers</p>
                <p>Innovating the way we learn to code.</p>
                <p class=""copyright"">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Template for temporary account suspension email"
                },
                new Setting
                {
                    Key = "ACCOUNT_PERMANENTLY_BANNED_EMAIL",
                    Group = "EMAIL_TEMPLATE",
                    Value = @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Account Permanently Suspended</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f5f5f5;
            padding: 40px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e0e0e0;
        }
        .email-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 35px 20px;
            text-align: center;
            border-bottom: 3px solid #ef4444;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin: 0;
        }
        .email-header .logo-highlight {
            color: #007bff;
        }
        .email-body {
            padding: 40px 35px;
        }
        .status-badge {
            display: inline-block;
            background-color: #fef2f2;
            border: 1px solid #fee2e2;
            color: #dc2626;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .email-body h2 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .email-body p {
            color: #555;
            margin-bottom: 20px;
            font-size: 15px;
        }
        .details-card {
            background-color: #fafafa;
            border-radius: 8px;
            border: 1px solid #eaeaea;
            padding: 20px;
            margin: 25px 0;
        }
        .detail-row {
            margin-bottom: 12px;
        }
        .detail-row:last-child {
            margin-bottom: 0;
        }
        .detail-label {
            font-size: 13px;
            font-weight: 600;
            color: #888;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
        }
        .detail-value {
            font-size: 15px;
            color: #222;
            font-weight: 500;
        }
        .reason-box {
            font-style: italic;
            color: #444;
            background-color: #f3f4f6;
            border-left: 4px solid #ef4444;
            padding: 12px 16px;
            border-radius: 0 6px 6px 0;
            margin-top: 5px;
        }
        .notice-card {
            background-color: #fff5f5;
            border-left: 4px solid #ef4444;
            padding: 20px;
            margin: 25px 0;
            border-radius: 0 8px 8px 0;
        }
        .notice-card h3 {
            color: #991b1b;
            font-size: 16px;
            font-weight: 600;
            margin-bottom: 8px;
        }
        .notice-card p {
            color: #7f1d1d;
            font-size: 14px;
            margin-bottom: 0;
        }
        .notice-card a {
            color: #991b1b;
            text-decoration: underline;
            font-weight: 600;
        }
        .email-footer {
            background-color: #fafafa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #eaeaea;
        }
        .email-footer p {
            color: #888;
            font-size: 13px;
            margin: 6px 0;
        }
        .email-footer .copyright {
            font-size: 12px;
            color: #aaa;
            margin-top: 15px;
        }
        .highlight {
            color: #007bff;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class=""email-wrapper"">
        <div class=""email-container"">
            <!-- Header -->
            <div class=""email-header"">
                <h1>DEV<span class=""logo-highlight"">NEXUS</span></h1>
            </div>

            <!-- Body -->
            <div class=""email-body"">
                <span class=""status-badge"">Permanent Suspension</span>
                <h2>Hello {userName},</h2>
                
                <p>We are writing to notify you that your <span class=""highlight"">DevNexus</span> account has been permanently suspended due to severe or repeated violations of our platform guidelines.</p>
                
                <!-- Details -->
                <div class=""details-card"">
                    <div class=""detail-row"">
                        <div class=""detail-label"">Suspension Status</div>
                        <div class=""detail-value"" style=""color: #dc2626; font-weight: 600;"">Permanently Terminated</div>
                    </div>
                    <div class=""detail-row"" style=""margin-top: 15px;"">
                        <div class=""detail-label"">Reason for Action</div>
                        <div class=""reason-box"">{reason}</div>
                    </div>
                </div>

                <p>This decision was made after careful review of your account activities. As a result, your access to DevNexus has been completely revoked, and you will no longer be able to log in or create a new account.</p>

                <!-- Notice -->
                <div class=""notice-card"">
                    <h3>Questions regarding this ban?</h3>
                    <p>If you believe there has been a serious error in our decision-making process, you can reach out to our Trust & Safety team at <a href=""mailto:studynest284@gmail.com"">studynest284@gmail.com</a>.</p>
                </div>

                <p style=""color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;"">
                    <strong>Security Notice:</strong> This is an automated administrative notification regarding your account state.
                </p>
            </div>

            <!-- Footer -->
            <div class=""email-footer"">
                <p>&copy; {currentYear} DevNexus | The Social Learning Network for Engineers</p>
                <p>Innovating the way we learn to code.</p>
                <p class=""copyright"">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Template for permanent account suspension email"
                },
                new Setting
                {
                    Key = "ACCOUNT_UNSUSPENDED_EMAIL",
                    Group = "EMAIL_TEMPLATE",
                    Value = @"<!DOCTYPE html>
<html lang=""en"">
<head>
    <meta charset=""UTF-8"">
    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"">
    <title>Account Active Again</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f5f5;
            color: #333;
            line-height: 1.6;
        }
        .email-wrapper {
            width: 100%;
            background-color: #f5f5f5;
            padding: 40px 0;
        }
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border: 1px solid #e0e0e0;
        }
        .email-header {
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
            padding: 35px 20px;
            text-align: center;
            border-bottom: 3px solid #10b981;
        }
        .email-header h1 {
            color: #ffffff;
            font-size: 26px;
            font-weight: 700;
            letter-spacing: 1.5px;
            margin: 0;
        }
        .email-header .logo-highlight {
            color: #007bff;
        }
        .email-body {
            padding: 40px 35px;
        }
        .status-badge {
            display: inline-block;
            background-color: #ecfdf5;
            border: 1px solid #d1fae5;
            color: #059669;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 14px;
            margin-bottom: 25px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .email-body h2 {
            color: #1a1a1a;
            font-size: 22px;
            margin-bottom: 15px;
            font-weight: 600;
        }
        .email-body p {
            color: #555;
            margin-bottom: 20px;
            font-size: 15px;
        }
        .welcome-card {
            background-color: #f0fdf4;
            border-radius: 8px;
            border: 1px solid #d1fae5;
            padding: 20px;
            margin: 25px 0;
            text-align: center;
        }
        .welcome-card p {
            color: #166534;
            font-size: 16px;
            font-weight: 500;
            margin-bottom: 0;
        }
        .button-wrapper {
            text-align: center;
            margin: 30px 0 15px 0;
        }
        .action-button {
            display: inline-block;
            background-color: #10b981;
            color: #ffffff;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.25);
            transition: all 0.2s ease;
        }
        .action-button:hover {
            background-color: #059669;
            box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
        }
        .email-footer {
            background-color: #fafafa;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #eaeaea;
        }
        .email-footer p {
            color: #888;
            font-size: 13px;
            margin: 6px 0;
        }
        .email-footer .copyright {
            font-size: 12px;
            color: #aaa;
            margin-top: 15px;
        }
        .highlight {
            color: #007bff;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class=""email-wrapper"">
        <div class=""email-container"">
            <!-- Header -->
            <div class=""email-header"">
                <h1>DEV<span class=""logo-highlight"">NEXUS</span></h1>
            </div>

            <!-- Body -->
            <div class=""email-body"">
                <span class=""status-badge"">Account Re-activated</span>
                <h2>Hello {userName},</h2>
                
                <p>We are absolutely thrilled to welcome you back! Your <span class=""highlight"">DevNexus</span> account has been successfully unsuspended and is now fully active.</p>
                
                <!-- Welcome Card -->
                <div class=""welcome-card"">
                    <p>You can now log in, share knowledge, publish articles, leave comments, and connect with other engineers on the platform.</p>
                </div>

                <!-- CTA Button -->
                <div class=""button-wrapper"">
                    <a href=""http://localhost:3000/"" class=""action-button"" style=""color: #ffffff"">Go to DevNexus Feed</a>
                </div>

                <p>We appreciate your cooperation and adherence to keeping our engineering community safe, collaborative, and constructive. Welcome back!</p>

                <p style=""color: #999; font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #eee;"">
                    <strong>Security Notice:</strong> For your security, please log in through our official secure site. Do not share your password with anyone.
                </p>
            </div>

            <!-- Footer -->
            <div class=""email-footer"">
                <p>&copy; {currentYear} DevNexus | The Social Learning Network for Engineers</p>
                <p>Innovating the way we learn to code.</p>
                <p class=""copyright"">This is an automated message, please do not reply.</p>
            </div>
        </div>
    </div>
</body>
</html>",
                    DataType = SettingDataType.String,
                    IsSensitive = false,
                    Description = "Template for account unsuspended email"
                }
            };

            foreach (var setting in defaultSettings)
            {
                var exists = await _context.Settings
                    .Where(s => s.Key == setting.Key && s.Group == setting.Group)
                    .AsNoTracking()
                    .FirstOrDefaultAsync();

                if (exists == null)
                {
                    await _context.Settings.AddAsync(setting);
                }
            }

            await _context.SaveChangesAsync();
        }
    }
}
