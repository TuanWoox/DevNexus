import { Page } from './Page';

export interface PagedData<TKey, TEntity> {
  page: Page<TKey>;
  data: TEntity[];
}
