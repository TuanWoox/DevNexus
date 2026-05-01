import { SortOrderType } from './sortOrderType';

export const INFINITE_PAGE_SIZE = 20;

export const FEED_BASE_PAYLOAD = {
    totalElements: 0,
    orders: [
        {
            sort: 'dateCreated',
            sortDir: SortOrderType.DESC,
            dynamicProperty: '',
            delimiter: '',
            dataType: '',
        },
    ],
    filter: [] as const,
    selected: [] as const,
} as const;

export const QUESTIONS_BASE_PAYLOAD = {
    totalElements: 0,
    orders: [
        {
            sort: 'dateCreated',
            sortDir: SortOrderType.DESC,
            dynamicProperty: '',
            delimiter: '',
            dataType: '',
        },
    ],
    filter: [] as const,
    selected: [] as const,
} as const;
