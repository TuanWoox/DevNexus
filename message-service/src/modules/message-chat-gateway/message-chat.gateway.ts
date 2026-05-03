import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Namespace, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
@WebSocketGateway({ namespace: 'message-chat' })
export class MessageChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(MessageChatGateway.name);

    private connections: Map<string, string[]> = new Map();

    @WebSocketServer()
    io!: Namespace;

    constructor(private readonly authService: AuthService) { }

    afterInit(): void {
        this.logger.log('Initialized');
    }

    handleConnection(@ConnectedSocket() client: Socket): void {
        try {
            const token =
                (client.handshake.auth?.token as string) ||
                client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
                (client.handshake.headers?.bearer as string);

            if (!token) {
                this.logger.warn(`Client ${client.id} has no token, disconnecting`);
                client.disconnect();
                return;
            }

            const payload = this.authService.validateToken(token);

            if (payload) {
                this.logger.log(`Client connected: ${client.id}`);
                (client.data as { profileId: string }).profileId = payload.profileId as string;
                this.clientConnect(payload?.profileId as string, client.id);
            } else {
                client.disconnect();
            }
        } catch {
            this.logger.warn(`Client ${client.id} has invalid token, disconnecting`);
            client.disconnect();
        }
    }

    handleDisconnect(@ConnectedSocket() client: Socket): void {
        this.logger.log(`Client disconnected: ${client.id}`);
        this.clientLeave(client.id);

    }

    private clientConnect(profileId: string | undefined, connectionId: string) {
        try {
            if (!profileId) return;
            const existingConnections = this.connections.get(profileId);
            if (existingConnections && existingConnections.length) {
                this.connections.set(profileId, [...existingConnections, connectionId]);
            }
            else {
                this.connections.set(profileId, [connectionId]);
            }
        }
        catch (ex) {
            this.logger.warn(ex)
        }
    }

    private clientLeave(connectionId: string) {
        try {
            const result = this.getArrayByValue(connectionId);
            if (!result) return;

            const { profileId, profileConnections } = result;
            const updatedConnections = profileConnections.filter(
                (id) => id !== connectionId,
            );

            if (updatedConnections.length) {
                this.connections.set(profileId, updatedConnections);
            } else {
                this.connections.delete(profileId);
            }
        }
        catch (ex) {
            this.logger.warn(ex)
        }
    }
    getArrayByValue(target: string): { profileId: string; profileConnections: string[] } | undefined {
        for (const [key, values] of this.connections) {
            if (values.includes(target)) {
                return { profileId: key, profileConnections: values };
            }
        }
        return undefined;
    }

    @SubscribeMessage('join-chat')
    async handleJoinChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string },
    ) {
        await client.join(`chat:${data.chatId}`);
    }

    @SubscribeMessage('leave-chat')
    async handleLeaveChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string },
    ) {
        await client.leave(`chat:${data.chatId}`);
    }

    @SubscribeMessage('typing-start')
    handleTypingStart(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string; FullName: string; AvatarUrl: string | null },
    ) {
        const profileId = (client.data as { profileId: string }).profileId;
        // exclude all sockets of the sender — a user can be logged in on multiple devices,
        // client.to(room) only excludes the current socket, other devices of the same user would still receive
        const allSenderSockets = this.connections.get(profileId) ?? [];
        client.to(`chat:${data.chatId}`).except(allSenderSockets).emit('typing-start', {
            chatId: data.chatId,
            profileId,
            FullName: data.FullName,
            AvatarUrl: data.AvatarUrl,
        });
    }

    @SubscribeMessage('typing-stop')
    handleTypingStop(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { chatId: string },
    ) {
        const profileId = (client.data as { profileId: string }).profileId;
        // same multi-device exclusion as typing-start
        const allSenderSockets = this.connections.get(profileId) ?? [];
        client.to(`chat:${data.chatId}`).except(allSenderSockets).emit('typing-stop', {
            chatId: data.chatId,
            profileId,
        });
    }

    emitToUsers(profileIds: string[], event: string, data: unknown): void {
        for (const profileId of profileIds) {
            const socketIds = this.connections.get(profileId);
            if (!socketIds?.length) continue;
            for (const socketId of socketIds) {
                this.io.to(socketId).emit(event, data);
            }
        }
    }
}