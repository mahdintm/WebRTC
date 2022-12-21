document.getElementById("roomid").innerHTML = new URLSearchParams(window.location.search).get("roomID");
let videoSourcesSelect = document.getElementById("video-source");
let audioSourcesSelect = document.getElementById("audio-source");
const { RTCPeerConnection, RTCSessionDescription } = window;
const peerConnection = new RTCPeerConnection();
const peerConnection2 = new RTCPeerConnection();
const peerConnection3 = new RTCPeerConnection();
const peerConnection4 = new RTCPeerConnection();
var peers = [
  { user: null, RTC: peerConnection },
  { user: null, RTC: peerConnection2 },
  { user: null, RTC: peerConnection3 },
  { user: null, RTC: peerConnection4 },
];
var socket = io();
socket.on("connect", async () => {
  // document.getElementById("ID").innerHTML = socket.id;
});
function leave(params) {
  socket.emit("deleteRoom", { room: new URLSearchParams(window.location.search).get("roomID") });
}
socket.emit("CreateRoom", { room: new URLSearchParams(window.location.search).get("roomID") });
socket.on("newUser", makecall);

socket.on("answer-made", async (data) => {
  console.log("answer-made");
  for await (const [index, element] of peers.entries()) {
    if (element.user == data.id) {
      return await element.RTC.setRemoteDescription(new RTCSessionDescription(data.answer));
    }
  }
});

async function makecall(userid) {
  console.log("makecall");
  let b = 0;
  let a = setInterval(async () => {
    b++;
    for await (const [index, element] of peers.entries()) {
      if (element.user == userid) {
        const offer = await element.RTC.createOffer();
        await element.RTC.setLocalDescription(new RTCSessionDescription(offer));
        return socket.emit("call-user", { offer, to: userid });
      } else if (element.user == null) {
        peers[index]["user"] = userid;
        const offer = await element.RTC.createOffer();
        await element.RTC.setLocalDescription(new RTCSessionDescription(offer));
        return socket.emit("call-user", { offer, to: userid });
      }
    }
    if (b == 2) {
      clearInterval(a);
    }
  }, 1000);
}

socket.on("redirect", (url) => {
  window.location.href = url;
});
let MediaStreamHelper = {
  _stream: null,
  getDevices: async function () {
    return await navigator.mediaDevices.enumerateDevices();
  },
  requestStream: async function () {
    if (this._stream) {
      this._stream.getTracks().forEach((track) => {
        track.stop();
      });
    }
    const audioSource = audioSourcesSelect.value;
    const videoSource = videoSourcesSelect.value;
    const constraints = {
      audio: {
        deviceId: audioSource ? { exact: audioSource } : undefined,
      },
      video: {
        deviceId: videoSource ? { exact: videoSource } : undefined,
      },
    };

    return await navigator.mediaDevices.getUserMedia(constraints);
  },
};

MediaStreamHelper.requestStream()
  .then(function (stream) {
    MediaStreamHelper._stream = stream;
    audioSourcesSelect.selectedIndex = [...audioSourcesSelect.options].findIndex((option) => option.text === stream.getAudioTracks()[0].label);
    videoSourcesSelect.selectedIndex = [...videoSourcesSelect.options].findIndex((option) => option.text === stream.getVideoTracks()[0].label);
    document.getElementById("local-video").srcObject = stream;
    stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    stream.getTracks().forEach((track) => peerConnection2.addTrack(track, stream));
    stream.getTracks().forEach((track) => peerConnection3.addTrack(track, stream));
    stream.getTracks().forEach((track) => peerConnection4.addTrack(track, stream));
    MediaStreamHelper.getDevices()
      .then((devices) => {
        devices.forEach((device) => {
          let option = new Option();
          option.value = device.deviceId;
          switch (device.kind) {
            case "videoinput":
              option.text = device.label || `Camera ${videoSourcesSelect.length + 1}`;
              videoSourcesSelect.appendChild(option);
              break;
            case "audioinput":
              option.text = device.label || `Microphone ${videoSourcesSelect.length + 1}`;
              audioSourcesSelect.appendChild(option);
              break;
          }
        });
      })
      .catch(function (e) {
        console.log(e.name + ": " + e.message);
      });
  })
  .catch(function (err) {
    console.error(err);
  });
