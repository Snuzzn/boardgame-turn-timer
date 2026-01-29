const http = require("http");
const { Server } = require("socket.io");
const pino = require("pino");
require("dotenv").config();

const log = pino({
    level: "info",
    transport: process.env.NODE_ENV !== "production"
        ? { target: "pino-pretty" }
        : undefined,
});

const server = http.createServer();


const allowedOrigins =
    process.env.NODE_ENV === "development"
        ? ["http://localhost:3000"]
        : [process.env.ORIGIN];

const io = new Server(server, {
    cors: {
        origin: (origin, cb) => {
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            log.warn({ origin, allowedOrigins }, "CORS blocked origin");
            return cb(new Error("Not allowed by CORS"), false);
        },
        methods: ["GET", "POST"],
        credentials: true,
    },
    transports: ["websocket"],
    pingInterval: 25000,
    pingTimeout: 20000,
});

io.on("connection", (socket) => {
    log.info(
        {
            socketId: socket.id,
            origin: socket.handshake.headers.origin,
            transport: socket.conn.transport.name,
        },
        "Socket connected"
    );

    socket.on("room:join", ({ roomCode, role }) => {
        if (!roomCode || !role) return;

        socket.join(roomCode);
        socket.data.roomCode = roomCode;
        socket.data.role = role; // "laptop" | "controller"

        const roomSize =
            io.sockets.adapter.rooms.get(roomCode)?.size ?? 0;

        log.info(
            { socketId: socket.id, roomCode, role, roomSize },
            "Joined room"
        );
    });

    socket.on("host:state", (state) => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        log.info(
            { roomCode, from: socket.id },
            "Host state broadcast"
        );

        socket.to(roomCode).emit("host:state", state?.snapshot);
    });

    socket.on("host:requestState", () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        log.info(
            { roomCode, from: socket.id },
            "Controller requested state from host"
        );

        socket.to(roomCode).emit("host:requestState");
    });

    socket.on("game:nextTurn", () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        log.info(
            { roomCode, from: socket.id },
            "Next turn"
        );

        socket.to(roomCode).emit("game:nextTurn");
    });

    socket.on("game:pauseResume", () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        log.info(
            { roomCode, from: socket.id },
            "Pause / Resume"
        );

        socket.to(roomCode).emit("game:pauseResume");
    });

    socket.on("game:revealTurn", () => {
        const roomCode = socket.data.roomCode;
        if (!roomCode) return;

        log.info(
            { roomCode, from: socket.id },
            "Reveal turn"
        );

        socket.to(roomCode).emit("game:revealTurn");
    });

    socket.on("disconnect", (reason) => {
        log.info(
            {
                socketId: socket.id,
                roomCode: socket.data.roomCode,
                role: socket.data.role,
                reason,
            },
            "Socket disconnected"
        );
    });

    socket.on("error", (err) => {
        log.error(
            { err, socketId: socket.id },
            "Socket error"
        );
    });
});

server.listen(3001, () => {
    log.info(
        {
            port: 3001,
            env: process.env.NODE_ENV,
            allowedOrigins,
        },
        "Socket.IO server started"
    );
});
