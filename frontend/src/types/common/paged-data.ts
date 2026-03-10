import { Page } from "./page";

export interface PagedData<T, Tkey> {
    data: T[],
    page: Page<Tkey>
}