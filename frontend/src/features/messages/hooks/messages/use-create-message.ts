import { useMutation, useQueryClient, InfiniteData } from "@tanstack/react-query";
import { messagingQueryKeys } from "../messaging-query-keys";
import { messageService } from "@/features/messages/services/message-service";
import type { CreateMessageDto, Message, PagedData } from "@/features/messages/types/contracts";
import { ReturnResult } from "@/types/common/return-result";
import { toast } from "sonner";

type MessagesPage = ReturnResult<PagedData<number, Message>>;
type MessagesInfiniteData = InfiniteData<MessagesPage>;



const prependToMessages = (
    oldData: MessagesInfiniteData | undefined,
    newMessage: Message,
): MessagesInfiniteData | undefined => {
    if (!oldData?.pages?.length) return oldData;

    const pages = oldData.pages.map((page, i) => {
        if (i !== 0 || !page.result) return page;
        return {
            ...page,
            result: {
                ...page.result,
                data: [newMessage, ...page.result.data],
            },
        };
    });

    return { ...oldData, pages };
};

export const useCreateMessage = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (variables: {
            createMessageDto: CreateMessageDto;
            file?: File;
        }): Promise<ReturnResult<Message>> => {
            return messageService.createMessage(variables.createMessageDto, variables.file);
        },
        onSuccess: (data, variables) => {
            if (data.result) {
                const newMessage = data.result as Message;
                const chatId = variables.createMessageDto.ChatId;

                //Append new message
                const messagesKey = messagingQueryKeys.chat("", chatId);
                queryClient.setQueryData<MessagesInfiniteData>(messagesKey, (oldData) =>
                    prependToMessages(oldData, newMessage),
                );

                //Invalidate chat again (This is just temporary and can work for all, later can optimize this)
                queryClient.invalidateQueries({
                    queryKey: ["messages", "inbox"],
                });
            } else {
                toast.error(data.message);
            }
        },
    });
};
