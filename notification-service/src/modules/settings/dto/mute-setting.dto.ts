import { IsEnum, IsString } from 'class-validator';
import { NotificationEventEnum, EntityTypeEnum } from '../../../shared/enums/NotificationEventEnum';

export class MuteSettingDto {
  @IsEnum(EntityTypeEnum)
  EntityType!: EntityTypeEnum;

  @IsString()
  EntityId!: string;

  @IsEnum(NotificationEventEnum)
  Type!: NotificationEventEnum;
}
