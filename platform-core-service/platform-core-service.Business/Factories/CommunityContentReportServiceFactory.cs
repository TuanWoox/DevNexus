using Microsoft.Extensions.DependencyInjection;
using platform_core_service.Common.Entities.DbEntities;
using platform_core_service.Common.Interfaces.Factories;
using platform_core_service.Common.Interfaces.Services;
using platform_core_service.Common.Models.DTOs.EntityDTO.CommunityContentReport;
using platform_core_service.Common.Models.DTOs.HelperDTO;
using platform_core_service.Common.Utils.Enums;
using System;
using System.Collections.Generic;

namespace platform_core_service.Business.Factories
{
    public class CommunityContentReportServiceFactory : ICommunityContentReportServiceFactory
    {
        private readonly IReadOnlyDictionary<ContentType, ICommunityContentReportService> _services;

        public CommunityContentReportServiceFactory(
            [FromKeyedServices(ContentType.Post)] ICommunityContentReportService postReportService,
            [FromKeyedServices(ContentType.QA)] ICommunityContentReportService qaPostReportService,
            [FromKeyedServices(ContentType.Comment)] ICommunityContentReportService commentReportService,
            [FromKeyedServices(ContentType.Answer)] ICommunityContentReportService answerReportService)
        {
            _services = new Dictionary<ContentType, ICommunityContentReportService>
            {
                [ContentType.Post] = postReportService,
                [ContentType.QA] = qaPostReportService,
                [ContentType.Comment] = commentReportService,
                [ContentType.Answer] = answerReportService,
            };
        }

        public ICommunityContentReportService GetCommunityContentReportService(ContentType contentType)
        {
            if (!_services.TryGetValue(contentType, out var service))
                throw new ArgumentOutOfRangeException(nameof(contentType), contentType, null);

            return service;
        }
    }
}