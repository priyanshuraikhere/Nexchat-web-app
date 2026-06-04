require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const Message = require("./models/Message");
const authRoutes = require("./routes/authRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("NexChat Server Running ✅");
});

// ─── Get messages by room (last 100) ───
app.get("/api/messages", async (req, res) => {
  try {
    const room = req.query.room || "general";
    const messages = await Message.find({ room })
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

// Track online users: { socketId -> username }
const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`🟢 Connected: ${socket.id}`);

  // User joins — also joins their default room
  socket.on("user_join", (username) => {
    onlineUsers.set(socket.id, { username, room: "general" });
    io.emit("online_users", Array.from(onlineUsers.values()).map((u) => u.username));
    console.log(`👤 ${username} joined`);
  });

  // ─── Room switch ───
  // Leave old room, join new room
  socket.on("join_room", (data) => {
    // data = { room, username }
    const prev = onlineUsers.get(socket.id);
    if (prev?.room) {
      socket.leave(prev.room);
    }
    socket.join(data.room);
    onlineUsers.set(socket.id, { username: data.username, room: data.room });
    console.log(`🔁 ${data.username} switched to room: ${data.room}`);
  });

  // ─── Send message (room-specific) ───
  socket.on("send_message", async (data) => {
    try {
      const room = data.room || "general";
      const message = await Message.create({
        author: data.author,
        text: data.text,
        time: data.time,
        room,
        replyTo: data.replyTo || null,
      });
      // Emit only to that room
      io.to(room).emit("receive_message", message);
    } catch (error) {
      console.error("❌ Message save error:", error.message);
    }
  });

  // ─── Typing indicator (room-specific) ───
  socket.on("typing", (data) => {
    // data = { user, room }
    socket.to(data.room).emit("user_typing", data);
  });

  // Disconnect
  socket.on("disconnect", () => {
    const info = onlineUsers.get(socket.id);
    onlineUsers.delete(socket.id);
    io.emit("online_users", Array.from(onlineUsers.values()).map((u) => u.username));
    console.log(`🔴 Disconnected: ${info?.username || socket.id}`);
  });
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
      console.log(`🚀 NexChat Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server start error:", error);
  }
};

startServer();
