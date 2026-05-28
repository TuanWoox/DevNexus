using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Models.DTOs.RecommendationDTO
{
    public class ScoredItem<T>
    {
        public T? Item { get; set; }
        public double Score { get; set; }
        public double ContentBasedScore { get; set; }
        public double SemanticScore { get; set; }
        public double TrendingScore { get; set; }
    }
}
