import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/' })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('EventsGateway');

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitToRestaurant(restaurantId: string, event: string, data: any) {
    this.server.to(`restaurant-${restaurantId}`).emit(event, data);
  }

  @SubscribeMessage('join-restaurant')
  handleJoinRestaurant(@MessageBody() restaurantId: string, @ConnectedSocket() client: Socket) {
    client.join(`restaurant-${restaurantId}`);
    this.logger.log(`Client ${client.id} joined restaurant-${restaurantId}`);
    return { event: 'joined', data: restaurantId };
  }

  @SubscribeMessage('join-kitchen')
  handleJoinKitchen(@MessageBody() restaurantId: string, @ConnectedSocket() client: Socket) {
    client.join(`kitchen-${restaurantId}`);
    return { event: 'joined-kitchen', data: restaurantId };
  }

  @SubscribeMessage('join-printer')
  handleJoinPrinter(@MessageBody() printerId: string, @ConnectedSocket() client: Socket) {
    client.join(`printer-${printerId}`);
    return { event: 'joined-printer', data: printerId };
  }

  emitToPrinter(printerId: string, event: string, data: any) {
    this.server.to(`printer-${printerId}`).emit(event, data);
  }

  emitToKitchen(restaurantId: string, event: string, data: any) {
    this.server.to(`kitchen-${restaurantId}`).emit(event, data);
  }
}
