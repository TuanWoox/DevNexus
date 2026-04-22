import { Page } from "./page";

export interface PagedData<TKey, TEntity> {
    page: Page<TKey>,
    data: TEntity[]
}