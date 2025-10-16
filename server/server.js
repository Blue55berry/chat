const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const userRoutes = require("./routes/userRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const path = require("path");

dotenv.config();
connectDB();
const app = express();

app.use(cors());
app.use(express.json()); // to accept JSON data

// Routes
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/message", messageRoutes);

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Error Handling middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(`Server running on PORT ${PORT}...`)
);

const io = require("socket.io")(server, {
  cors: {
    origin: "http://localhost:3001",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    socket.user = userData;
    console.log(`${userData.username} is online`);
    socket.emit("connected");
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User Joined Room: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageReceived) => {
    let chat = newMessageReceived.chat;

    if (!chat.users) return console.log("chat.users not defined");

    chat.users.forEach((user) => {
      if (user._id === newMessageReceived.sender._id) return;

      socket.in(user._id).emit("message received", newMessageReceived);
    });
  });

  // Video Call
  socket.on("callUser", ({ userToCall, signalData, from, name }) => {
    console.log(`Received callUser event from ${from} to ${userToCall}`);
    io.to(userToCall).emit("callUser", { signal: signalData, from, name });
  });

  socket.on("answerCall", (data) => {
    io.to(data.to).emit("callAccepted", data.signal);
  });

  socket.on("callEnded", (data) => {
    io.to(data.to).emit("callEnded");
  });

  // Audio Call
  socket.on("audioCallUser", ({ userToCall, signalData, from, name }) => {
    io.to(userToCall).emit("audioCallUser", { signal: signalData, from, name });
  });

  socket.on("answerAudioCall", (data) => {
    io.to(data.to).emit("audioCallAccepted", data.signal);
  });

  socket.on("audioCallEnded", (data) => {
    io.to(data.to).emit("audioCallEnded");
  });

  socket.on("disconnect", () => {
    if (socket.user) {
      console.log(`${socket.user.username} is offline`);
    }
    console.log("USER DISCONNECTED");
  });
});
