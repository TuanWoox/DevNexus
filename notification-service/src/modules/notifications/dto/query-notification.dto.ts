import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { NotificationEventEnum } from '../../../shared/enums/NotificationEventEnum';

export class QueryNotificationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  filter?: 'all' | 'unread';

  @IsOptional()
  @IsEnum(NotificationEventEnum)
  type?: NotificationEventEnum;
}
