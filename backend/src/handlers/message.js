// /backend/src/handlers/message.js
module.exports = (socket, io) => {
  socket.on("message", (data) => {
    console.log("Message received:", data);
    // 모든 클라이언트에 메시지 브로드캐스트
    io.emit("message", data);
  });

  // 필요하다면 추가 메시지 이벤트 핸들러 작성...
};
