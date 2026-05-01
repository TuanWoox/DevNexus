import { SortOrderType } from "@/constants/sortOrderType";
import { FilterType } from "@/constants/filterType";
import { FilterOperator } from "@/constants/filterOperator";

export interface OrderMapping {
    sort: string;
    sortDir: SortOrderType;
    dynamicProperty: string;
    delimiter: string;
    dataType: string;
}

export interface FilterMapping {
    prop: string;
    value: string | number | boolean;
    filterOperator: FilterOperator;
    filterType: FilterType;
    dynamicProperty: string;
    delimiter: string;
}

export interface Page<T> {
    size: number;
    pageNumber?: number;
    totalElements?: number;
    orders?: OrderMapping[];
    filter?: FilterMapping[];
    selected?: T[];
    indexPaging?: number;
}
