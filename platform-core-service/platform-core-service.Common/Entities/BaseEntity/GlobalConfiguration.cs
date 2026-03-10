using System.Linq.Expressions;
using System.Reflection;
using Microsoft.EntityFrameworkCore.Metadata;

namespace platform_core_service.Common.Entities.BaseEntity
{
    public static class GlobalConfiguration
    {
        public static void AddSoftDeleteQueryFilter(this IMutableEntityType entityData)
        {
            var methodToCall = typeof(GlobalConfiguration)
                                .GetMethod(nameof(GetSoftDeleteFilter), BindingFlags.NonPublic | BindingFlags.Static)
                                    .MakeGenericMethod(entityData.ClrType);

            var filter = methodToCall.Invoke(null, new object[] { });

            entityData.SetQueryFilter((LambdaExpression)filter);

            entityData.AddIndex(entityData.FindProperty(nameof(IDeleted.Deleted)));
        }

        private static LambdaExpression GetSoftDeleteFilter<TEntity>()
            where TEntity : class, IDeleted
        {
            Expression<Func<TEntity, bool>> filter = x => !x.Deleted;
            return filter;
        }
    }
}
