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

@WebSocketGateway({ namespace: 'notifications' })
export class NotificationGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(NotificationGateway.name);
  private readonly connections = new Map<string, string[]>();

  @WebSocketServer()
  io!: Namespace;

  constructor(private readonly authService: AuthService) { }

  afterInit(): void {
    this.logger.log('Notification gateway initialized');
  }

  handleConnection(@ConnectedSocket() client: Socket): void {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        client.handshake.headers?.authorization?.replace(/^Bearer\s+/i, '') ||
        (client.handshake.headers?.bearer as string);

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.authService.validateToken(token);
      (client.data as { profileId: string }).profileId = payload.profileId;
      this.clientConnect(payload.profileId, client.id);
      this.logger.log(
        `Client connected: ${client.id} (profile: ${payload.profileId})`,
      );
    } catch {
      this.logger.warn(`Client ${client.id} has invalid token, disconnecting`);
      client.disconnect();
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket): void {
    this.clientLeave(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToUser(profileId: string, event: string, data: unknown): void {
    const socketIds = this.connections.get(profileId);
    if (!socketIds?.length) return;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  emitToUsers(profileIds: string[], event: string, data: unknown): void {
    for (const profileId of profileIds) {
      this.emitToUser(profileId, event, data);
    }
  }

  private clientConnect(profileId: string, connectionId: string): void {
    const existing = this.connections.get(profileId);
    if (existing?.length) {
      this.connections.set(profileId, [...existing, connectionId]);
    } else {
      this.connections.set(profileId, [connectionId]);
    }
  }

  private clientLeave(connectionId: string): void {
    for (const [profileId, sockets] of this.connections) {
      const updated = sockets.filter((id) => id !== connectionId);
      if (updated.length) {
        this.connections.set(profileId, updated);
      } else {
        this.connections.delete(profileId);
      }
    }
  }
}
