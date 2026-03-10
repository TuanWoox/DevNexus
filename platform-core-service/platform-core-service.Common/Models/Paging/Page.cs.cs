using System.Linq.Expressions;
using System.Linq;
using System.Linq.Dynamic.Core;
using platform_core_service.Common.Utils.Enums;
using platform_core_service.Common.Models.DTOs.PagingDTO;
using platform_core_service.Common.Utils.Extensions;
using Newtonsoft.Json;

namespace platform_core_service.Common.Models.Paging
{
    public class Page : Page<string>
    {

    }
    public class Page<Tkey>
    {
        public int Size { get; set; }
        public int PageNumber { get; set; }
        public int TotalElements { get; set; }
        public List<OrderMapping> Orders { get; set; }
        public List<FilterMapping> Filter { get; set; }
        public virtual List<Tkey> Selected { get; set; }

        #region Format Filters
        public void FormatFilter<T>(ref IQueryable<T> query, string mainTBL = "")
        {
            try
            {
                if (query != null && Filter != null && Filter.Count > 0)
                {
                    string filter = string.Empty;
                    foreach (var item in Filter)
                    {
                        //If there is no filter operator, skip this item
                        if (item.FilterOperator == null) continue;

                        Enum.TryParse<AllFilterOperator>(item.FilterOperator.ToString(), out AllFilterOperator operatorAll);
                        if (operatorAll == AllFilterOperator.IsFilter)
                        {
                            switch (item.FilterType)
                            {
                                //This is case when we want to filter based on a text property in database
                                case FilterType.Text:
                                    filter = FilterTextOperator(filter, item);
                                    break;
                                case FilterType.EmailActions:
                                    filter = FilterTextOperator(filter, item);
                                    break;
                                case FilterType.DropDown:
                                    filter = FilterDropDownOperator(filter, item);
                                    break;
                                case FilterType.DynamicContent:
                                    filter = FilterDynamicContentOperator(filter, item);
                                    break;
                                case FilterType.DateTime:
                                    filter = FilterDateOperator(filter, item);
                                    break;
                                case FilterType.Boolean:
                                    filter = FilterBooleanOperator(filter, item);
                                    break;
                                case FilterType.Number:
                                    filter = FilterNumberOperator(filter, item);
                                    break;
                                case FilterType.Date:
                                    filter = FilterDateOperator(filter, item);
                                    break;
                            }
                        }
                        else
                        {
                            filter = FilterNullOrNotNull(filter, item, operatorAll);
                        }
                    }
                    //If there is a filter, remove the last "And" and return the filter
                    if (!string.IsNullOrEmpty(filter))
                    {
                        filter = filter.Remove(filter.Length - 4);
                        query = query.Where(filter);
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

        }
        #endregion

        #region Format Orders
        public void FormatOrder<T>(ref IQueryable<T> query, string mainTBL = "")
        {
            try
            {
                if (query != null && Orders != null && Orders.Count > 0)
                {
                    if (!string.IsNullOrEmpty(mainTBL))
                    {
                        mainTBL += ".";
                    }

                    var parameter = Expression.Parameter(typeof(T), "e");

                    for (int i = 0; i < Orders.Count; i++)
                    {
                        var item = Orders[i];
                        var sortCondition = $"{mainTBL}{item.Sort.UpperFirstChar()} {item.SortDir}";

                        if (i == 0)
                        {
                            // Fix: Use Dynamic LINQ for string-based property names
                            query = query.OrderBy(sortCondition);
                        }
                        else
                        {
                            var orderedQueryable = query as IOrderedQueryable<T>;
                            query = orderedQueryable.ThenBy(sortCondition);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
        }
        #endregion

        #region TEXT FILTERS
        //This is used to filter text properties in the filter mapping
        public string FilterTextOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            try
            {
                var filterOp = item.FilterOperator?.ToString();
                var propName = $"{mainTBL}{item.Prop.UpperFirstChar()}";
                var value = item.Value?.ToString()?.Trim();
                if (filterOp != FilterType.EmailActions.ToString() && filterOp != "NoEmailActions")
                {
                    if (Enum.TryParse(filterOp, out TextFilterOperator operatorText))
                    {
                        if (!string.IsNullOrEmpty(value))
                        {
                            switch (operatorText)
                            {
                                case TextFilterOperator.Contains:
                                    filter += $" {propName}.ToLower().Contains(\"{value.ToLower()}\") And ";
                                    break;
                                case TextFilterOperator.DoesNotContains:
                                    filter += $"( !{propName}.ToLower().Contains(\"{value.ToLower()}\") || {propName} == null ) And ";
                                    break;
                                case TextFilterOperator.EndsWith:
                                    filter += $" {propName}.ToLower().EndsWith(\"{value.ToLower()}\") And ";
                                    break;
                                case TextFilterOperator.IsEqualTo:
                                    filter += $" {propName}.ToLower() == \"{value.ToLower()}\" And ";
                                    break;
                                case TextFilterOperator.IsNotEqualTo:
                                    filter += $" {propName}.ToLower() != \"{value.ToLower()}\" And ";
                                    break;
                                case TextFilterOperator.StartsWith:
                                    filter += $" {propName}.ToLower().StartsWith(\"{value.ToLower()}\") And ";
                                    break;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return filter;
        }
        #endregion

        #region DROP DOWN FILTERS
        public string FilterDropDownOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            try
            {
                var filterOp = item.FilterOperator?.ToString();
                var propName = $"{mainTBL}{item.Prop.UpperFirstChar()}";
                var rawValue = item.Value?.ToString();

                if (string.IsNullOrEmpty(filterOp) || string.IsNullOrEmpty(rawValue))
                    return filter;

                var tempValue = rawValue
                    .Replace("\"[", string.Empty)
                    .Replace("]\"", string.Empty)
                    .Replace("[", string.Empty)
                    .Replace("]", string.Empty)
                    .Replace("\r\n", string.Empty)
                    .Trim();

                if (string.IsNullOrEmpty(tempValue))
                    return filter;


                if (Enum.TryParse(filterOp, out DropDownFilterOperator operatorDropDown))
                {
                    switch (operatorDropDown)
                    {
                        case DropDownFilterOperator.Contains:
                            filter += $" {propName} in ({tempValue}) And ";
                            break;

                        case DropDownFilterOperator.DoesNotContains:
                            filter += $" !({propName} in ({tempValue})) And ";
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

            return filter;
        }
        #endregion

        #region DYNAMIC CONTENT FILTERS

        // This is used to filter dynamic content (like list-based dropdowns or tags) in the filter mapping
        public string FilterDynamicContentOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            try
            {
                var filterOp = item.FilterOperator?.ToString();
                var propName = $"{mainTBL}{item.Prop.UpperFirstChar()}";
                var rawValue = item.Value?.ToString();

                if (!string.IsNullOrEmpty(filterOp) && !string.IsNullOrEmpty(rawValue))
                {
                    var tempValue = rawValue
                        .Replace("\"[", string.Empty)
                        .Replace("]\"", string.Empty)
                        .Replace("[", string.Empty)
                        .Replace("]", string.Empty)
                        .Replace("\r\n", string.Empty)
                        .Trim();

                    if (!string.IsNullOrEmpty(tempValue))
                    {
                        var valueList = tempValue.Split(",", StringSplitOptions.RemoveEmptyEntries)
                                                                     .Select(v => v.Trim())
                                                                     .ToList();

                        if (Enum.TryParse(filterOp, out DropDownFilterOperator operatorDropDown) && valueList.Count > 0)
                        {
                            string subFilter = string.Empty;

                            switch (operatorDropDown)
                            {
                                case DropDownFilterOperator.Contains:
                                    foreach (var value in valueList)
                                    {
                                        subFilter += $" {propName}.Contains(\"{value}\") Or ";
                                    }

                                    if (!string.IsNullOrEmpty(subFilter))
                                    {
                                        subFilter = subFilter[..^4]; // Remove last ' Or '
                                        filter += $"({subFilter}) And ";
                                    }
                                    break;

                                case DropDownFilterOperator.DoesNotContains:
                                    foreach (var value in valueList)
                                    {
                                        subFilter += $" !{propName}.Contains(\"{value}\") And ";
                                    }

                                    if (!string.IsNullOrEmpty(subFilter))
                                    {
                                        subFilter = subFilter[..^5]; // Remove last ' And '
                                        var filterNull = $"string.IsNullOrEmpty({propName})";
                                        filter += $"({filterNull} || ({subFilter})) And ";
                                    }
                                    break;
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

            return filter;
        }

        #endregion

        #region DATE AND DATETIME FILTERS
        //This is used to filter date properties in the filter mapping
        public string FilterDateOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            try
            {
                Enum.TryParse(item.FilterOperator.ToString(), out DateTimeFilterOperator operatorDateTime);

                var filterValue = item.Value?.ToString();

                if (operatorDateTime != DateTimeFilterOperator.Between &&
                    operatorDateTime != DateTimeFilterOperator.Quarter)
                {
                    if ((filterValue.StartsWith("{") && filterValue.EndsWith("}")) ||
                        (filterValue.StartsWith("[") && filterValue.EndsWith("]")))
                    {
                        item.Value = null;
                    }
                }

                if (operatorDateTime == DateTimeFilterOperator.Between &&
                    filterValue.StartsWith("[") && filterValue.EndsWith("]"))
                {
                    item.Value = null;
                }

                if (operatorDateTime == DateTimeFilterOperator.Quarter &&
                    filterValue.StartsWith("{") && filterValue.EndsWith("}"))
                {
                    item.Value = null;
                }

                if (!string.IsNullOrEmpty(item.Value?.ToString()))
                {
                    var propName = $"{mainTBL}{item.Prop.UpperFirstChar()}";
                    var dateTime = (DateTime)item.Value;
                    var datetimeFilter = new DateTimeOffset(dateTime, TimeSpan.Zero);

                    if (!string.IsNullOrEmpty(item.FilterOperator?.ToString()))
                    {
                        var startOfDate = datetimeFilter;
                        var lastOfDate = datetimeFilter.AddDays(1).AddTicks(-1);

                        switch (operatorDateTime)
                        {
                            case DateTimeFilterOperator.IsEqualTo:
                                filter += $" ({propName} >= \"{startOfDate}\" And {propName} <= \"{lastOfDate}\") And ";
                                break;

                            case DateTimeFilterOperator.IsNotEqualTo:
                                filter += $" ({propName} < \"{startOfDate}\" Or {propName} > \"{lastOfDate.AddSeconds(1)}\") And ";
                                break;

                            case DateTimeFilterOperator.IsAfter:
                                filter += $" ({propName} >= \"{lastOfDate}\") And ";
                                break;

                            case DateTimeFilterOperator.IsAfterOrEqual:
                                filter += $" ({propName} >= \"{startOfDate}\") And ";
                                break;

                            case DateTimeFilterOperator.IsBefore:
                                filter += $" ({propName} < \"{startOfDate}\") And ";
                                break;

                            case DateTimeFilterOperator.IsBeforeOrEqual:
                                filter += $" ({propName} < \"{lastOfDate}\") And ";
                                break;

                            case DateTimeFilterOperator.Between:
                                {
                                    var dataValue = item.Value.ToString();
                                    if (dataValue.StartsWith("{") && dataValue.EndsWith("}"))
                                    {
                                        var dateRange = JsonConvert.DeserializeObject<DateRangeFilter>(dataValue);
                                        filter += $" ({propName} >= \"{dateRange.StartDate}\" And {propName} <= \"{dateRange.EndDate}\") And ";
                                    }
                                }
                                break;

                            case DateTimeFilterOperator.Quarter:
                                {
                                    var dataValue = item.Value.ToString();
                                    if (dataValue.StartsWith("[") && dataValue.EndsWith("]"))
                                    {
                                        var quarters = JsonConvert.DeserializeObject<List<int>>(dataValue);
                                        foreach (var (value, index) in quarters.Select((v, i) => (v, i)))
                                        {
                                            if (index == 0) filter += "(";
                                            var range = DevNexusExtension.GetDateTimeByQuarter(value);
                                            filter += $" ({propName} >= \"{range.StartDate}\" And {propName} <= \"{range.EndDate}\") Or ";
                                        }

                                        if (!string.IsNullOrEmpty(filter))
                                        {
                                            filter = filter.Remove(filter.Length - 4); // Remove last " Or "
                                            filter += ") And ";
                                        }
                                    }
                                }
                                break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

            return filter;
        }
        #endregion

        #region BOOLEAN FILTERS
        public string FilterBooleanOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            var tempValue = item.Value?.ToString()
                .Replace("[", string.Empty)
                .Replace("]", string.Empty)
                .Replace("\r\n", string.Empty)
                .Trim();

            if (string.IsNullOrEmpty(tempValue) || string.IsNullOrEmpty(item.FilterOperator?.ToString()))
                return filter;

            if (Enum.TryParse<BooleanFilterOperator>(item.FilterOperator.ToString(), out var operatorDropDown))
            {
                var column = $"{mainTBL}{item.Prop.UpperFirstChar()}";
                var tempValueLower = tempValue.ToLower();

                switch (operatorDropDown)
                {
                    case BooleanFilterOperator.Contains:
                        if (tempValueLower == "false")
                            filter += $" {column} != true And ";
                        else if (tempValueLower == "true")
                            filter += $" {column} = true And ";
                        else
                            filter += $" {column} in ({tempValue},null) And ";
                        break;

                    case BooleanFilterOperator.DoesNotContains:
                        if (tempValueLower == "false")
                            filter += $" {column} = true And ";
                        else if (tempValueLower == "true")
                            filter += $" {column} != true And ";
                        else
                            filter += $" !({column} in ({tempValue},null)) And ";
                        break;
                }
            }

            return filter;
        }
        #endregion

        #region NUMBER FILTERS
        public string FilterNumberOperator(string filter, FilterMapping item, string mainTBL = "")
        {
            try
            {
                if (item.Value != null)
                {
                    Double.TryParse(item.Value?.ToString(), out double number);
                    Enum.TryParse<NumberFilterOperator>(item.FilterOperator.ToString(), out NumberFilterOperator operatorNumber);

                    string prop = string.IsNullOrEmpty(mainTBL)
                        ? item.Prop.UpperFirstChar()
                        : $"{mainTBL}.{item.Prop.UpperFirstChar()}";

                    switch (operatorNumber)
                    {
                        case NumberFilterOperator.IsEqualTo:
                            filter += $" {prop} = {number} And ";
                            break;
                        case NumberFilterOperator.IsNotEqualTo:
                            filter += $" {prop} != {number} And ";
                            break;
                        case NumberFilterOperator.IsGreaterThan:
                            filter += $" {prop} > {number} And ";
                            break;
                        case NumberFilterOperator.IsGreaterThanOrEqualTo:
                            filter += $" {prop} >= {number} And ";
                            break;
                        case NumberFilterOperator.IsLessThan:
                            filter += $" {prop} < {number} And ";
                            break;
                        case NumberFilterOperator.IsLessThanOrEqualTo:
                            filter += $" {prop} <= {number} And ";
                            break;
                    }
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }
            return filter;
        }
        #endregion

        #region NULL AND NOT NULL FILTERS
        public string FilterNullOrNotNull(string filter, FilterMapping item, AllFilterOperator operatorAll, string mainTBL = "")
        {
            try
            {
                var propName = $"{mainTBL}{item.Prop.UpperFirstChar()}";

                switch (item.FilterType)
                {
                    case FilterType.Text:
                    case FilterType.DropDown:
                    case FilterType.DynamicContent:
                    case FilterType.EmailActions:
                        switch (operatorAll)
                        {
                            case AllFilterOperator.IsEmpty:
                                filter += $" string.IsNullOrEmpty({propName}) And ";
                                break;
                            case AllFilterOperator.IsNotEmpty:
                                filter += $" !string.IsNullOrEmpty({propName}) And ";
                                break;
                        }
                        break;

                    case FilterType.DateTime:
                    case FilterType.Date:
                    case FilterType.Number:
                        switch (operatorAll)
                        {
                            case AllFilterOperator.IsEmpty:
                                filter += $" {propName} = null And ";
                                break;
                            case AllFilterOperator.IsNotEmpty:
                                filter += $" {propName} != null And ";
                                break;
                        }
                        break;
                }
            }
            catch (Exception ex)
            {
                DevNexusLogger.Instance.Error(ex);
            }

            return filter;
        }
    }
    #endregion
}
