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
      console.error(`Socket authentication failed: ${error.message}`);
      next(new Error("Authentication error: Token verification failed"));
    }
  });

  io.on("connection", async (socket) => {
    console.log(`Socket connected: ${socket.id}, User: ${socket.user?.uuid}`);
    const userUuid = socket.user?.uuid;

    // 투표 참여 상태 변경 브로드캐스트
    socket.on("voteParticipationChanged", async ({ groupUuid, voteUuid, participate }) => {
      try {
        // 투표 정보 조회
        const [rows] = await pool.query(
          `SELECT participant_count FROM (
            SELECT vote_uuid, COUNT(user_uuid) as participant_count
            FROM travel_vote_participants
            GROUP BY vote_uuid
          ) AS counts
          WHERE vote_uuid = ?`,
          [voteUuid],
        );
        const participant_count = rows[0]?.participant_count || 0;

        // 참여 시 채팅방 룸 가입
        if (participate) {
          const [[{ schedule_uuid }]] = await pool.query(
            `SELECT schedule_uuid FROM travel_votes WHERE uuid = ?`,
            [voteUuid],
          );
          if (schedule_uuid) {
            const [[chatRoom]] = await pool.query(
              `SELECT uuid FROM chat_rooms WHERE schedule_uuid = ?`,
              [schedule_uuid],
            );
            if (chatRoom?.uuid) {
              socket.join(chatRoom.uuid);
              console.log(`User ${userUuid} joined chat room ${chatRoom.uuid}`);
            }
          }
        }

        // 그룹 내 모든 클라이언트에 브로드캐스트
        io.to(groupUuid).emit("voteParticipationUpdated", {
          voteUuid,
          participant_count,
          userUuid,
          participate,
        });
        console.log(
          `voteParticipationUpdated emitted to group ${groupUuid}: vote ${voteUuid}, count ${participant_count}`,
        );
      } catch (error) {
        console.error(`voteParticipationChanged error: ${error.message}`);
      }
    });

    if (userUuid) {
      socket.join(userUuid);
      if (onlineUsers.has(userUuid)) {
        onlineUsers.get(userUuid).push(socket.id);
      } else {
        onlineUsers.set(userUuid, [socket.id]);
      }
      console.log(`User ${userUuid} joined. Sockets:`, onlineUsers.get(userUuid));

      try {
        const friends = await friendModel.getAcceptedFriendUuidsForSocket(userUuid);
        friends.forEach(({ uuid }) => {
          io.to(uuid).emit("userOnlineStatus", { uuid: userUuid, online: true });
        });
      } catch (err) {
        console.error(`Failed to fetch friends for ${userUuid}: ${err.message}`);
      }
    } else {
      console.warn("No userUuid for connected socket.");
    }

    // 그룹 초대 이벤트 처리
    socket.on("inviteToGroup", async ({ groupUuid, invitedUserUuid }, callback) => {
      const inviterUuid = socket.user?.uuid;
      try {
        console.log(`Inviting ${invitedUserUuid} to group ${groupUuid} by ${inviterUuid}`);
        const inviteUuid = await groupModel.sendGroupInvite(
          groupUuid,
          inviterUuid,
          invitedUserUuid,
        );
        const inviterProfile = await friendModel.getFriendProfileByUuid(inviterUuid);
        const group = await groupModel.getGroupByUuid(groupUuid);

        io.to(invitedUserUuid).emit("group-invite", {
          type: "groupInvite",
          id: inviteUuid,
          sender: inviterProfile?.name,
          groupName: group?.name,
        });
        callback?.({ success: true, inviteUuid });
      } catch (err) {
        console.error(`Group invite error: ${err.message}`);
        callback?.({ success: false, message: err.message });
      }
    });

    // 알림 응답 이벤트
    socket.on("notificationResponse", async ({ id, type, response }, callback) => {
      callback = typeof callback === "function" ? callback : () => {};
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
            io.to(invite.invited_by_uuid).emit("groupInviteAccepted", {
              inviteUuid: id,
              invitedUserUuid: socket.user.uuid,
              groupUuid,
            });
            callback({ success: true, message: "그룹에 참여했습니다." });
          } else if (response === "declined") {
            await pool.query("DELETE FROM group_invites WHERE uuid = ?", [id]);
            io.to(invite.invited_by_uuid).emit("groupInviteRejected", {
              inviteUuid: id,
              invitedUserUuid: socket.user.uuid,
              groupUuid,
            });
            callback({ success: true, message: "초대를 거절했습니다." });
          }
        } catch (error) {
          console.error(`notificationResponse error: ${error.message}`);
          callback({ success: false, message: "오류가 발생했습니다." });
        }
      }
    });

    // 그룹 초대 취소
    socket.on("cancelGroupInvite", async ({ inviteUuid, groupUuid, invitedUserUuid }, callback) => {
      try {
        await pool.query("DELETE FROM group_invites WHERE uuid = ?", [inviteUuid]);
        io.to(invitedUserUuid).emit("groupInviteCancelled", {
          inviteUuid,
          groupUuid,
          inviterUuid: socket.user?.uuid,
        });
        callback?.({ success: true });
      } catch (err) {
        console.error(`cancelGroupInvite error: ${err.message}`);
        callback?.({ success: false, message: err.message });
      }
    });

    // 룸 참여
    socket.on("joinRoom", (roomUuid) => {
      socket.join(roomUuid);
      console.log(`User ${userUuid} joined room ${roomUuid}`);
    });

    // 메시지 전송
    socket.on("sendMessage", async ({ roomUuid, message }) => {
      try {
        const senderUuid = socket.user.uuid;
        const savedMessage = await chatModel.saveMessage(roomUuid, senderUuid, message);
        io.to(roomUuid).emit("receiveMessage", savedMessage);
      } catch (err) {
        console.error(`Message save error: ${err.message}`);
      }
    });

    // 그룹 참여
    socket.on("joinGroup", async (data, callback) => {
      const { groupUuid, userUuid } = data;
      console.log(`joinGroup request: ${userUuid} to ${groupUuid}`);
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
        console.error(`joinGroup error: ${error.message}`);
        callback({ success: false, message: "그룹 참여 실패", error: error.message });
      }
    });

    // 친구 온라인 상태 조회
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
        console.error(`Friends online status error: ${err.message}`);
      }
    });

    // 친구 요청
    socket.on("sendFriendRequest", ({ from, to }) => {
      console.log(`Friend request: ${from} -> ${to}`);
      socket.to(to).emit("friendRequestSent", { from, to });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
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
              console.error(`Offline status notify error: ${err.message}`);
            });
        }
      }
    });
  });

  return io;
};

module.exports = { initSocketIO };
