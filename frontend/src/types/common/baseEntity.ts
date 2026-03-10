export interface BaseEntity<TKey> {
    id: TKey;
    dateCreated?: string;      // or Date if you plan to parse it
    dateModified?: string;     // or Date
    deleted?: boolean;
    dateDeleted?: string;      // or Date
}
