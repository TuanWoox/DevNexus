import { Logger, UseGuards } from '@nestjs/common';
import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    OnGatewayInit,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { AuthGuard } from '../auth/auth.guard';

@WebSocketGateway({ namespace: 'message-chat' })
@UseGuards(AuthGuard)
export class MessageChatGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
    private readonly logger = new Logger(MessageChatGateway.name);

    @WebSocketServer() io: Server;

    constructor(private readonly authService: AuthService) { }

    afterInit(): void {
        this.logger.log('Initialized');
    }

    handleConnection(client: Socket): void {
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
                console.log(payload);
                this.logger.log(`Client connected: ${client.id}`);
            } else {
                client.disconnect();
            }
        } catch {
            this.logger.warn(`Client ${client.id} has invalid token, disconnecting`);
            client.disconnect();
        }
    }

    handleDisconnect(client: Socket): void {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
}