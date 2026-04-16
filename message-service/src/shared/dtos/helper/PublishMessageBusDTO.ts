import { MessageBusEntityEnum, MessageBusEnum } from "src/utils/enums/MessageBusEnum";

export interface PublishMessageBusDTO<TEntity> {
    Entity: TEntity;
    MessageBusEnum: MessageBusEnum;
    MessageBusEntityEnum: MessageBusEntityEnum;
}