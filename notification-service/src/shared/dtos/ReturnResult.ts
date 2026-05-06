import { Expose } from 'class-transformer';

export class ReturnResult<T> {
  @Expose({ name: 'result' })
  Result?: T;

  @Expose({ name: 'message' })
  Message?: string;
}
