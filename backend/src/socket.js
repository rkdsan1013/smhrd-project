const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel");
const pool = require("./config/db");
const groupModel = require("./models/groupModel"); // 그룹 관련 함수 사용

// onlineUsers: 각 사용자 uuid에 대해 연결된 socket id들을 배열로 저장
const onlineUsers = new Map();

const initSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  global.io = io; // 전역에서 소켓 사용

  // 인증 미들웨어
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

  io.on("connection", async (socket) => {
    console.log("✅ Socket 연결됨:", socket.id);
    const userUuid = socket.user?.uuid;
    if (userUuid) {
      socket.join(userUuid);
      if (onlineUsers.has(userUuid)) {
        onlineUsers.get(userUuid).push(socket.id);
      } else {
        onlineUsers.set(userUuid, [socket.id]);
      }
      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);
        friends.forEach(({ uuid }) => {
          io.to(uuid).emit("userOnlineStatus", { uuid: userUuid, online: true });
        });
      } catch (err) {
        console.error("친구 목록 가져오기 실패:", err);
      }
    }

    socket.on("joinRoom", (roomUuid) => {
      socket.join(roomUuid);
    });

    socket.on("sendMessage", async ({ roomUuid, message }) => {
      try {
        const senderUuid = socket.user.uuid;
        const savedMessage = await chatModel.saveMessage(roomUuid, senderUuid, message);
        io.to(roomUuid).emit("receiveMessage", savedMessage);
      } catch (err) {
        console.error("메시지 저장 오류:", err);
      }
    });

    // ▶️ 그룹 참여 이벤트
    socket.on("joinGroup", async (data, callback) => {
      const { groupUuid, userUuid } = data;
      console.log("joinGroup 요청 수신:", data);
      try {
        // 현재 사용자가 이미 해당 그룹의 멤버인지 확인
        const myGroups = await groupModel.getMyGroups(userUuid);
        const isMember = myGroups.some((group) => group.uuid === groupUuid);
        if (isMember) {
          console.log(`사용자 ${userUuid}는 이미 그룹 ${groupUuid}의 멤버입니다.`);
          return callback({ success: false, message: "이미 그룹의 멤버입니다." });
        }
        // 그룹 멤버 등록 (role: 'member')
        await pool.query(
          "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
          [groupUuid, userUuid],
        );
        console.log(`사용자 ${userUuid}가 그룹 ${groupUuid}에 참여 등록되었습니다.`);
        callback({ success: true, message: "그룹 참여 완료" });
        socket.join(groupUuid);
        io.to(groupUuid).emit("groupMemberJoined", { userUuid });
      } catch (error) {
        console.error("joinGroup 에러:", error);
        callback({ success: false, message: "그룹 참여 실패", error: error.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket 연결 종료:", socket.id);
      const userUuid = socket.user?.uuid;
      if (!userUuid) {
        console.warn("disconnect 시점에 userUuid가 없습니다.");
        return;
      }
      if (onlineUsers.has(userUuid)) {
        const userSockets = onlineUsers.get(userUuid);
        const index = userSockets.indexOf(socket.id);
        if (index !== -1) {
          userSockets.splice(index, 1);
        }
        if (userSockets.length === 0) {
          onlineUsers.delete(userUuid);
          friendModel
            .getAcceptedFriendUuidsForSocket(userUuid)
            .then((friends) => {
              friends.forEach(({ uuid }) => {
                io.to(uuid).emit("userOnlineStatus", { uuid: userUuid, online: false });
              });
            })
            .catch((err) => {
              console.error("오프라인 상태 알림 실패:", err);
            });
        }
      }
    });

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

    socket.on("sendFriendRequest", ({ from, to }) => {
      console.log("📨 친구 요청:", from, "->", to);
      socket.to(to).emit("friendRequestSent", { from, to });
    });
  });

  return io;
};

module.exports = { initSocketIO };
