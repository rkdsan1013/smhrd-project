const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel");
const groupModel = require("./models/groupModel");
const pool = require("./config/db");

const onlineUsers = new Map();

const initSocketIO = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  global.io = io;

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

    socket.on("joinGroup", async (data, callback) => {
      const { groupUuid, userUuid } = data;
      console.log("joinGroup 요청 수신:", data);
      try {
        const myGroups = await groupModel.getMyGroups(userUuid);
        const isMember = myGroups.some((group) => group.uuid === groupUuid);
        if (isMember) {
          return callback({ success: false, message: "이미 그룹의 멤버입니다." });
        }
        await pool.query(
          "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
          [groupUuid, userUuid],
        );
        callback({ success: true, message: "그룹 참여 완료" });
        socket.join(groupUuid);
        io.to(groupUuid).emit("groupMemberJoined", { userUuid });
      } catch (error) {
        console.error("joinGroup 에러:", error);
        callback({ success: false, message: "그룹 참여 실패", error: error.message });
      }
    });

    // ✅ 그룹 초대 이벤트
    socket.on("inviteToGroup", async ({ groupUuid, invitedUserUuid }, callback) => {
      const inviterUuid = socket.user?.uuid;
      try {
        // 초대 생성 → inviteUuid 반환
        const inviteUuid = await groupModel.sendGroupInvite(
          groupUuid,
          inviterUuid,
          invitedUserUuid,
        );

        // 초대자, 그룹 정보 조회
        const inviterProfile = await friendModel.getFriendProfileByUuid(inviterUuid);
        const group = await groupModel.getGroupByUuid(groupUuid);

        // 실시간 알림 전송
        io.to(invitedUserUuid).emit("group-invite", {
          inviteUuid, // ✅ 초대 UUID 포함
          groupUuid,
          groupName: group?.name,
          inviterUuid,
          inviterName: inviterProfile?.name,
        });

        if (callback) callback({ success: true });
      } catch (err) {
        console.error("❌ 그룹 초대 오류:", err);
        if (callback) callback({ success: false, message: err.message });
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ Socket 연결 종료:", socket.id);
      const userUuid = socket.user?.uuid;
      if (!userUuid) return;

      if (onlineUsers.has(userUuid)) {
        const userSockets = onlineUsers.get(userUuid);
        const index = userSockets.indexOf(socket.id);
        if (index !== -1) userSockets.splice(index, 1);

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
