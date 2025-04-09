// /backend/src/socket.js

const { Server } = require("socket.io");
const { jwtVerify, secretKey } = require("./utils/jwtUtils");
const cookie = require("cookie");
const chatModel = require("./models/chatModel");
const friendModel = require("./models/friendModel");
const groupModel = require("./models/groupModel"); // 수정된 groupModel.js 사용
const pool = require("./config/db");

const onlineUsers = new Map();

// 소켓 초기화 함수
const initSocketIO = (server) => {
  // 소켓 서버 생성 및 CORS 설정
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

        // 알림 페이로드 수정: 클라이언트 Notification 타입에 맞춤
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
      if (typeof callback !== "function") {
        callback = () => {};
      }
      if (type === "groupInvite") {
        try {
          const [rows] = await pool.query("SELECT * FROM group_invites WHERE uuid = ?", [id]);
          if (rows.length === 0) {
            return callback({ success: false, message: "초대장이 존재하지 않습니다." });
          }
          const invite = rows[0]; // invite 객체에 invited_by_uuid, group_uuid, invited_user_uuid 있음.
          const groupUuid = invite.group_uuid;
          if (response === "accepted") {
            await pool.query(
              "INSERT INTO group_members (group_uuid, user_uuid, role) VALUES (?, ?, 'member')",
              [groupUuid, socket.user.uuid],
            );
            await pool.query("DELETE FROM group_invites WHERE uuid = ?", [id]);
            socket.join(groupUuid);
            io.to(groupUuid).emit("groupMemberJoined", { userUuid: socket.user.uuid });
            // 초대 수락 시, 초대한 측에게 이벤트 전달하여 초대 리스트에서 제거
            io.to(invite.invited_by_uuid).emit("groupInviteAccepted", {
              inviteUuid: id,
              invitedUserUuid: socket.user.uuid,
              groupUuid,
            });
            callback({ success: true, message: "그룹에 참여했습니다." });
          } else if (response === "declined") {
            await pool.query("DELETE FROM group_invites WHERE uuid = ?", [id]);
            // 초대 거절 시, 초대한 측에 이벤트 전달하여 취소 버튼을 초기화
            io.to(invite.invited_by_uuid).emit("groupInviteRejected", {
              inviteUuid: id,
              invitedUserUuid: socket.user.uuid,
              groupUuid,
            });
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
      try {
        await pool.query("DELETE FROM group_invites WHERE uuid = ?", [inviteUuid]);

        // ✅ 핵심: 초대받은 사람에게 정확한 초대 UUID로 제거 요청
        io.to(invitedUserUuid).emit("groupInviteCancelled", {
          inviteUuid, // 이게 핵심
          groupUuid,
          inviterUuid: socket.user?.uuid,
        });

        callback({ success: true });
      } catch (err) {
        console.error("cancelGroupInvite error:", err);
        callback({ success: false });
      }
    });

    // 룸 참여 이벤트
    socket.on("joinRoom", (roomUuid) => {
      socket.join(roomUuid);
    });

    // 메시지 전송 이벤트 (DB 저장 후 전파)
    socket.on("sendMessage", async ({ roomUuid, message }) => {
      try {
        const senderUuid = socket.user.uuid;
        const savedMessage = await chatModel.saveMessage(roomUuid, senderUuid, message);
        io.to(roomUuid).emit("receiveMessage", savedMessage);
      } catch (err) {
        console.error("메시지 저장 오류:", err);
      }
    });

    // 그룹 참여 이벤트
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

    // 친구 온라인 상태 조회 요청
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

    // 친구 요청 전송 이벤트
    socket.on("sendFriendRequest", ({ from, to }) => {
      console.log("📨 친구 요청:", from, "->", to);
      socket.to(to).emit("friendRequestSent", { from, to });
    });

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
