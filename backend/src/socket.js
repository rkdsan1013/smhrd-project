// File: /backend/src/socket.js

const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel");
const groupModel = require("./models/groupModel"); // 수정된 groupModel.js 사용
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

  // JWT 토큰 검증 미들웨어
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
    console.log("Socket connected:", socket.id);
    const userUuid = socket.user?.uuid;
    if (userUuid) {
      // 각 사용자는 자신의 uuid를 룸명으로 가입
      socket.join(userUuid);
      if (onlineUsers.has(userUuid)) {
        onlineUsers.get(userUuid).push(socket.id);
      } else {
        onlineUsers.set(userUuid, [socket.id]);
      }
      console.log(`User ${userUuid} joined. Current sockets:`, onlineUsers.get(userUuid));

      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);
        friends.forEach(({ uuid }) => {
          io.to(uuid).emit("userOnlineStatus", { uuid: userUuid, online: true });
        });
      } catch (err) {
        console.error("친구 목록 가져오기 실패:", err);
      }
    } else {
      console.warn("연결된 소켓에 userUuid 정보가 없음.");
    }

    // 그룹 초대 이벤트 처리
    socket.on("inviteToGroup", async ({ groupUuid, invitedUserUuid }, callback) => {
      const inviterUuid = socket.user?.uuid;
      try {
        console.log(`Inviting user ${invitedUserUuid} to group ${groupUuid} by ${inviterUuid}`);

        // 그룹 초대 생성: 수정된 sendGroupInvite 함수를 사용
        const inviteUuid = await groupModel.sendGroupInvite(
          groupUuid,
          inviterUuid,
          invitedUserUuid,
        );

        // 초대자 프로필 및 그룹 정보 조회
        const inviterProfile = await friendModel.getFriendProfileByUuid(inviterUuid);
        const group = await groupModel.getGroupByUuid(groupUuid);

        if (!onlineUsers.has(invitedUserUuid)) {
          console.warn(`초대 대상 ${invitedUserUuid}은(는) 온라인 상태가 아닙니다.`);
        } else {
          console.log(
            `초대 대상 ${invitedUserUuid}의 소켓 목록:`,
            onlineUsers.get(invitedUserUuid),
          );
        }

        // 수정된 알림 페이로드: 클라이언트 Notification 타입에 맞춤
        io.to(invitedUserUuid).emit("group-invite", {
          type: "groupInvite",
          id: inviteUuid,
          sender: inviterProfile?.name,
          groupName: group?.name,
        });
        if (callback && typeof callback === "function") {
          callback({ success: true, inviteUuid });
        }
      } catch (err) {
        console.error("그룹 초대 오류:", err);
        if (callback && typeof callback === "function") {
          callback({ success: false, message: err.message });
        }
      }
    });

    // 알림 응답 이벤트: 초대 수락/거절 처리
    socket.on("notificationResponse", async ({ id, type, response }, callback) => {
      // 기본 callback 함수 할당 (없으면 빈 함수 사용)
      if (typeof callback !== "function") {
        callback = () => {};
      }

      if (type === "groupInvite") {
        try {
          const [rows] = await pool.query("SELECT * FROM group_invites WHERE uuid = ?", [id]);
          if (rows.length === 0) {
            return callback({ success: false, message: "초대장이 존재하지 않습니다." });
          }
          const invite = rows[0];
          const groupUuid = invite.group_uuid;
          if (response === "accepted") {
            await pool.query(
              "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
              [groupUuid, socket.user.uuid],
            );
            await pool.query("DELETE FROM group_invites WHERE uuid = ?", [id]);
            socket.join(groupUuid);
            io.to(groupUuid).emit("groupMemberJoined", { userUuid: socket.user.uuid });
            callback({ success: true, message: "그룹에 참여했습니다." });
          } else if (response === "declined") {
            await pool.query("DELETE FROM group_invites WHERE uuid = ?", [id]);
            callback({ success: true, message: "초대를 거절했습니다." });
          }
        } catch (error) {
          console.error("notificationResponse error:", error);
          callback({ success: false, message: "오류가 발생했습니다." });
        }
      }
    });

    // 그룹 초대 취소 이벤트 처리
    socket.on("cancelGroupInvite", async ({ inviteUuid, groupUuid, invitedUserUuid }, callback) => {
      if (typeof callback !== "function") {
        callback = () => {};
      }
      try {
        await pool.query("DELETE FROM group_invites WHERE uuid = ?", [inviteUuid]);
        io.to(invitedUserUuid).emit("groupInviteCancelled", { groupUuid });
        callback({ success: true, message: "초대가 취소되었습니다." });
      } catch (error) {
        console.error("cancelGroupInvite error:", error);
        callback({ success: false, message: "초대 취소에 실패했습니다." });
      }
    });

    // 기타 기존 이벤트 처리...
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
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
  });

  return io;
};

module.exports = { initSocketIO };
