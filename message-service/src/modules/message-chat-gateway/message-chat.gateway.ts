import { Logger } from '@nestjs/common';
import {
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
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