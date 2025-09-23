import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import cluster from "cluster";
import { cpus } from "os";
const app = express();
const PORT = 4000;
const allowedOrigins = [
    "http://localhost:3000",
    /\.vercel\.app$/,
    "https://white-board-client-eta.vercel.app"
];
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Allow-Control-Allow-Headers", "Origin , X-Requested-With, Content-Type, Accept");
    next();
});
app.use(cors({
    origin: "https://white-board-client-eta.vercel.app"
}));
if (cluster.isPrimary) {
    const numCPUs = cpus().length;
    for (let i = 0; i < numCPUs; i++)
        cluster.fork();
    console.log(`Primary ${process.pid} is running, forking ${numCPUs} workers...`);
    cluster.on("exit", (worker) => {
        console.log(`Worker ${worker.process.pid} died, starting new one...`);
        cluster.fork();
    });
}
else {
    const server = createServer(app);
    const io = new Server(server, {
        perMessageDeflate: false,
        cors: {
            origin: (origin, callback) => {
                if (!origin)
                    return callback(null, true);
                if (allowedOrigins.some((o) => o instanceof RegExp ? o.test(origin) : o === origin)) {
                    callback(null, true);
                }
                else {
                    callback(new Error("Not allowed by CORS: " + origin));
                }
            },
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
                const userLeft = sessions[roomId]?.members.filter(id => id !== socket.id);
                console.log("user-left", userLeft);
                const size = io.sockets.adapter.rooms.get(roomId)?.size || 0;
                socket.to(roomId).emit("user-left", { size });
            }
        });
    });
    app.get("/", (req, res) => {
        res.send("hello world");
    });
    server.listen(PORT, () => {
        console.log("server started");
    });
}
//# sourceMappingURL=server.js.map