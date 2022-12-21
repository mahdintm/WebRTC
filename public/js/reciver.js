const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();
var socket = io();
socket.on("connect", () => {
  document.getElementById("ID").innerHTML = socket.id;
});
socket.on("redirect", (url) => {
  window.location.href = url;
});
document.getElementById("roomid").innerHTML = new URLSearchParams(window.location.search).get("roomID");
socket.emit("SetRoom", { room: new URLSearchParams(window.location.search).get("roomID") });
socket.on("call-made", async (data) => {
  console.log("call-made");
  await peerConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(new RTCSessionDescription(answer));
  getCalled = true;
  socket.emit("make-answer", {
    answer,
    to: data.socket,
  });
});
peerConnection.ontrack = function ({ streams: [stream] }) {
  // setInterval(() => {
  //   console.log(stream);
  // }, 1000);

  const remoteVideo = document.getElementById("remote-video");
  // if (remoteVideo) {
  remoteVideo.srcObject = stream;
  // }
};
