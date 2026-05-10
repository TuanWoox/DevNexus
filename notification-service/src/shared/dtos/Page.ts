export interface Page<T> {
  size: number;
  pageNumber: number;
  totalElements: number;
  selected: T[];
  indexPaging: T | null;
}
