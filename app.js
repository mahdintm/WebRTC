const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const uuid = require("uuid");
app.use(express.static("public"));
let rooms = [{ roomName: undefined, Streamer: undefined, users: [] }];

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/pages/index.html");
});
app.get("/sender", (req, res) => {
  res.sendFile(__dirname + "/pages/sender.html");
});
app.get("/reciver", (req, res) => {
  res.sendFile(__dirname + "/pages/reciver.html");
});

io.on("connection", (socket) => {
  socket.on("disconnecting", () => {
    // console.log(socket); // the Set contains at least the socket ID
  });
  console.log("User Connect:", io.engine.clientsCount);
  socket.on("disconnect", async (reason, a, b) => {
    for await (const [index] of rooms.entries()) {
      var index_ = rooms[index]["users"].indexOf(socket.id);
      if (index_ != -1) rooms[index]["users"].splice(index, 1);
    }
  });
  // socket.on("SetRoom", async (data) => {
  //   for await (const [index, element] of rooms.entries()) {
  //     if (element.roomName === data.room) {
  //       rooms[index]["users"].push(socket.id);
  //     } else if (rooms.length == index + 1) {
  //       socket.emit("redirect", "/");
  //     }
  //   }
  // });
  socket.on("call-user", (data) => {
    socket.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on("make-answer", (data) => {
    socket.to(data.to).emit("answer-made", {
      id: socket.id,
      answer: data.answer,
    });
  });
});
io.engine.generateId = (req) => {
  return uuid.v4();
};
// io.of("/").adapter.on("create-room", (room) => {
//   console.log(`room ${room} was created`);
// });

// io.of("/").adapter.on("join-room", (room, id) => {
//   console.log(`socket ${id} has joined room ${room}`);
// });
server.listen(3000, () => {
  console.log("listening on *:3000");
});
