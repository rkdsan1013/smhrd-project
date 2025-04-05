const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel"); // ✅ 친구 목록 불러오기용

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
      onlineUsers.set(userUuid, socket.id);

      // ✅ 친구들에게 이 유저의 온라인 상태 전송
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
    // ✅ 연결 종료 처리
    socket.on("disconnect", () => {
      console.log("❌ Socket 연결 종료:", socket.id);

      const userUuid = socket.user?.uuid;

      if (!userUuid) {
        console.warn("disconnect 시점에 userUuid가 없습니다.");
        return;
      }

      // 접속자 목록에서 제거
      onlineUsers.delete(userUuid);

      // 친구들에게 오프라인 상태 알림
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
    });

    // ✅ 프론트에서 친구들의 온라인 상태 요청 시
    socket.on("getFriendsOnlineStatus", async () => {
      const userUuid = socket.user?.uuid;
      if (!userUuid) return;

      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);

        const statusList = friends.map((f) => ({
          uuid: f.uuid,
          online: onlineUsers.has(f.uuid),
        }));

        io.to(socket.id).emit("friendsOnlineStatus", statusList);
      } catch (err) {
        console.error("친구 온라인 상태 조회 실패:", err);
      }
    });
  });
};

module.exports = { initSocketIO };
