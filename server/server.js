import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
const app = express();
const PORT = 4000;
app.use(cors());
const server = createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["POST", "GET"]
    }
});
var sessions = {};
io.on("connection", (socket) => {
    console.log("socket connected", socket.id);
    socket.on("join-session", (newData) => {
        if (!sessions[newData.roomId] || sessions[newData.roomId]?.members.length === 0) {
            sessions[newData.roomId] = { members: [newData.socket] };
        }
        sessions[newData.roomId]?.members.push(newData.socket);
        socket.join(newData.roomId);
        const size = io.sockets.adapter.rooms.get(newData.roomId)?.size || 0;
        io.to(newData.roomId).emit("user-joined", { size });
        console.log("joined-sessions", sessions);
    });
    socket.on("leave-session", (roomId) => {
        console.log("current socket", socket.id, roomId);
        socket.leave(roomId);
        const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
        io.to(roomId).emit("user-left", { size });
        const members = sessions[roomId]?.members;
        if (!members)
            return;
        sessions[roomId] = {
            members: members.filter((id) => id !== socket.id),
        };
        if (sessions[roomId].members.length === 0) {
            delete sessions[roomId];
        }
    });
    socket.on("line-drawing", ({ roomId, line }) => {
        console.log("drawing line !!! ............", roomId);
        console.log("line drawn", line);
        const RoomId = roomId.trim();
        socket.to(RoomId).emit("drawing", { line: line });
    });
    socket.on("disconnect", () => {
        console.log("socket disconnected", socket.id);
        for (let roomId in sessions) {
            console.log("rooms", roomId);
            const userLeft = sessions[roomId]?.members.filter(id => id !== socket.id);
            console.log("user left", userLeft);
            console.log("sesssi", sessions);
            const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            io.to(roomId).emit("user-left", { size });
        }
    });
});
app.get("/", (req, res) => {
    res.send("hello world");
});
server.listen(PORT, () => {
    console.log("server started");
});
//# sourceMappingURL=server.js.map