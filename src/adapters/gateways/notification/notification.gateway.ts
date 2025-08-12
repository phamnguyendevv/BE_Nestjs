// // gateways/chat/chat.gateway.ts
// import {
//   ConnectedSocket,
//   MessageBody,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
//   SubscribeMessage,
//   WebSocketGateway,
//   WebSocketServer,
// } from '@nestjs/websockets'

// import { Server, Socket } from 'socket.io'

// import { SendMessageDto } from './dto/send-message.dto'
// import { MessagePresenter } from './presenters/message.presenter'

// @WebSocketGateway({
//   cors: {
//     origin: '*',
//   },
// })
// export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
//   @WebSocketServer()
//   server: Server

//   handleConnection(client: Socket) {
//     console.log(`Client connected: ${client.id}`)
//   }

//   handleDisconnect(client: Socket) {
//     console.log(`Client disconnected: ${client.id}`)
//   }

//   @SubscribeMessage('joinRoom')
//   handleJoinRoom(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() roomId: string,
//   ): void {
//     client.join(roomId)
//     console.log(`Client ${client.id} joined room ${roomId}`)
//     // Gửi thông báo cho chính client đó là đã tham gia thành công.
//     client.emit('joinedRoom', `Bạn đã tham gia phòng ${roomId}`)
//   }

//   /**
//    * Lắng nghe sự kiện 'sendMessage' từ client.
//    * Xử lý việc gửi tin nhắn tới một phòng chat.
//    */
//   @SubscribeMessage('sendMessage')
//   handleSendMessage(
//     @ConnectedSocket() client: Socket,
//     @MessageBody() payload: SendMessageDto, // Dữ liệu sẽ được validate bởi SendMessageDto
//   ): void {
//     // 1. Tạo một object dữ liệu thô (giả lập việc lưu vào DB)
//     const rawMessage = {
//       id: Date.now(), // Dùng timestamp làm ID tạm thời
//       text: payload.message,
//       senderSocketId: client.id,
//       createdAt: new Date(),
//     }

//     // 2. Sử dụng Presenter để định dạng dữ liệu trước khi gửi đi
//     const presentedMessage = new MessagePresenter(rawMessage)

//     // 3. Phát sự kiện 'newMessage' tới TẤT CẢ client trong phòng chat đó.
//     //    `this.server.to(roomId)` đảm bảo tin nhắn chỉ đi đúng phòng.
//     this.server.to(payload.roomId).emit('newMessage', presentedMessage)

//     console.log(`Message sent to room ${payload.roomId}:`, presentedMessage)
//   }
// }
