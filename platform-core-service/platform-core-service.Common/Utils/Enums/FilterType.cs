using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace platform_core_service.Common.Utils.Enums
{
    public enum FilterType
    {
        Text,
        Number,
        DateTime,
        DropDown,
        Boolean,
        Date,
        DropDownList,
        DynamicContent,
        EmailActions,
    }
    public enum TextFilterOperator
    {
        Contains,
        DoesNotContains,
        EndsWith,
        IsEqualTo,
        IsNotEqualTo,
        IsNullOrEmpty,
        IsNotNullOrNotEmpty,
        StartsWith
    }
    public enum NumberFilterOperator
    {
        IsEqualTo,
        IsNotEqualTo,
        IsGreaterThanOrEqualTo,
        IsGreaterThan,
        IsLessThanOrEqualTo,
        IsLessThan,
    }
    public enum DateTimeFilterOperator
    {
        IsBefore,
        IsBeforeOrEqual,
        IsAfter,
        IsAfterOrEqual,
        IsEqualTo,
        IsNotEqualTo,
        Between,
        Quarter
    }
    public enum DropDownFilterOperator
    {
        Contains,
        DoesNotContains,
    }
    public enum BooleanFilterOperator
    {
        Contains,
        DoesNotContains
    }
    public enum AllFilterOperator
    {
        IsFilter,
        IsEmpty,
        IsNotEmpty,
    }
    public enum SearchOptions
    {
        SearchWholePhrase,
        SearchEachWord,
        Elastic
    }
}
