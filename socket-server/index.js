import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Adjust this to your frontend URL in production
        methods: ["GET", "POST"]
    }
});

// Map of userId -> socketId
const userSockets = new Map();

io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} connected with socket ${socket.id}`);
    }

    socket.on('disconnect', () => {
        if (userId) {
            userSockets.delete(userId);
            console.log(`User ${userId} disconnected`);
        }
    });

    // Example: Handle real-time messaging
    socket.on('send_message', (data) => {
        const { receiverId, message, senderId } = data;
        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_message', {
                senderId,
                message,
                timestamp: new Date()
            });
        }
    });

    // Example: Handle bid invitations
    socket.on('send_invitation', (data) => {
        const { receiverId, projectId, message } = data;
        const receiverSocketId = userSockets.get(receiverId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit('new_invitation', {
                projectId,
                message,
                timestamp: new Date()
            });
        }
    });
});

// API endpoint for Lambdas to trigger socket events
app.post('/notify', (req, res) => {
    const { userId, event, data } = req.body;
    const socketId = userSockets.get(userId);

    if (socketId) {
        io.to(socketId).emit(event, data);
        return res.json({ success: true, message: 'Notification sent' });
    }

    res.status(404).json({ success: false, message: 'User not connected' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
    console.log(`Socket server running on port ${PORT}`);
});
