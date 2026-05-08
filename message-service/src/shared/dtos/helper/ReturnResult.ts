import 'reflect-metadata';
import { Expose } from 'class-transformer';

export class ReturnResult<T> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @Expose({ name: 'result' })
    Result?: T;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    @Expose({ name: 'message' })
    Message?: string;
}