// 파일명: socket.js

const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel"); // ✅ 친구 목록 불러오기용

// onlineUsers: 각 사용자 uuid에 대해 연결된 socket id들을 배열로 저장합니다.
const onlineUsers = new Map(); // ✅ 전역 접속자 목록

const initSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  global.io = io; // ✅ 소켓 전역 사용 가능하게 설정

  // ✅ 인증 미들웨어
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookies = cookie.parse(cookieHeader);
      const token = cookies.accessToken;

      if (!token) return next(new Error("Authentication error: Token missing"));

      const { payload } = await jwtVerify(token, secretKey);
      socket.user = payload;
      next();
    } catch (error) {
      console.error("토큰 검증 실패:", error);
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  // ✅ 연결 처리
  io.on("connection", async (socket) => {
    console.log("✅ Socket 연결됨:", socket.id);

    const userUuid = socket.user?.uuid;
    if (userUuid) {
      socket.join(userUuid);
      // 사용자의 소켓 연결을 배열에 추가 (여러 연결을 지원)
      if (onlineUsers.has(userUuid)) {
        onlineUsers.get(userUuid).push(socket.id);
      } else {
        onlineUsers.set(userUuid, [socket.id]);
      }

      // ✅ 친구들에게 이 유저의 온라인 상태 전파
      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);
        friends.forEach(({ uuid }) => {
          io.to(uuid).emit("userOnlineStatus", {
            uuid: userUuid,
            online: true,
          });
        });
      } catch (err) {
        console.error("친구 목록 가져오기 실패:", err);
      }
    }

    // ✅ 채팅방 입장
    socket.on("joinRoom", (roomUuid) => {
      socket.join(roomUuid);
    });

    // ✅ 메시지 전송 처리
    socket.on("sendMessage", async ({ roomUuid, message }) => {
      try {
        const senderUuid = socket.user.uuid;
        const savedMessage = await chatModel.saveMessage(roomUuid, senderUuid, message);
        io.to(roomUuid).emit("receiveMessage", savedMessage);
      } catch (err) {
        console.error("메시지 저장 오류:", err);
      }
    });

    // ✅ 연결 종료 처리
    socket.on("disconnect", () => {
      console.log("❌ Socket 연결 종료:", socket.id);
      const userUuid = socket.user?.uuid;
      if (!userUuid) {
        console.warn("disconnect 시점에 userUuid가 없습니다.");
        return;
      }
      // 현재 socket id만 배열에서 제거
      if (onlineUsers.has(userUuid)) {
        const userSockets = onlineUsers.get(userUuid);
        const index = userSockets.indexOf(socket.id);
        if (index !== -1) {
          userSockets.splice(index, 1);
        }
        // 연결된 소켓이 없으면 완전히 제거하고 오프라인 상태 전파
        if (userSockets.length === 0) {
          onlineUsers.delete(userUuid);
          friendModel
            .getAcceptedFriendUuidsForSocket(userUuid)
            .then((friends) => {
              friends.forEach(({ uuid }) => {
                io.to(uuid).emit("userOnlineStatus", {
                  uuid: userUuid,
                  online: false,
                });
              });
            })
            .catch((err) => {
              console.error("오프라인 상태 알림 실패:", err);
            });
        }
      }
    });

    // ✅ 프론트에서 친구들의 온라인 상태 요청 시
    socket.on("getFriendsOnlineStatus", async () => {
      const userUuid = socket.user?.uuid;
      if (!userUuid) return;
      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);
        const statusList = friends.map((f) => ({
          uuid: f.uuid,
          online: onlineUsers.has(f.uuid) && onlineUsers.get(f.uuid).length > 0,
        }));
        io.to(socket.id).emit("friendsOnlineStatus", statusList);
      } catch (err) {
        console.error("친구 온라인 상태 조회 실패:", err);
      }
    });
  });
};

module.exports = { initSocketIO };
