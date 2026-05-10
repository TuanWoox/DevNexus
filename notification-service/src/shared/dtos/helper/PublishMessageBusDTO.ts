import { MessageBusEntityEnum, MessageBusEnum } from '../../../utils/enums/MessageBusEnum';

export interface PublishMessageBusDTO<TEntity> {
    Entity: TEntity;
    MessageBusEnum: MessageBusEnum;
    MessageBusEntityEnum: MessageBusEntityEnum;
}
