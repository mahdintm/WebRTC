const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const uuid = require("uuid");
app.use(express.static("public"));

const CodeGenerator = require("node-code-generator");
var generator = new CodeGenerator();

async function GenerateCode(length) {
  let pattern = "";
  for (let i = 0; i < length; i++) {
    pattern += "*";
  }
  return generator.generateCodes(pattern, 1, { alphanumericRegex: /\*(?!\+)/g });
}

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

app.get("/getroomcode", async (req, res) => {
  res.send(await GenerateCode(5));
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
  socket.on("deleteRoom", async (data) => {
    io.to(socket.id).emit("redirect", "/");
    for await (const [index, element] of rooms.entries()) {
      if (element.roomName == data.room) {
        element.users.forEach((element___) => {
          io.to(element___).emit("redirect", "/");
        });
        var index_ = rooms.indexOf(element);
        if (index_ != -1) rooms.splice(index, 1);
      }
    }
  });
  socket.on("CreateRoom", (data) => {
    rooms.push({ roomName: data.room, Streamer: socket.id, users: [] });
  });
  socket.on("SetRoom", async (data) => {
    for await (const [index, element] of rooms.entries()) {
      if (element.roomName === data.room) {
        console.log(111);
        rooms[index]["users"].push(socket.id);
        io.to(element.Streamer).emit("newUser", socket.id);
      } else if (rooms.length == index + 1) {
        socket.emit("redirect", "/");
      }
    }
  });
  socket.on("call-user", (data) => {
    io.to(data.to).emit("call-made", {
      offer: data.offer,
      socket: socket.id,
    });
  });

  socket.on("make-answer", (data) => {
    io.to(data.to).emit("answer-made", {
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
server.listen(3200, () => {
  console.log("listening on *:3200");
});
