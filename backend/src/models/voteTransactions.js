const voteQueries = require("./voteQueries");
const scheduleQueries = require("./scheduleQueries");
const { v4: uuidv4 } = require("uuid");

const createTravelVote = async (
  dbPool,
  groupUuid,
  creatorUuid,
  title,
  location,
  startDate,
  endDate,
  headcount,
  description,
  voteDeadline,
) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    console.log(`[createTravelVote] 트랜잭션 시작 - 그룹 ${groupUuid}, 생성자 ${creatorUuid}`);

    // 일정 생성
    const scheduleUuid = uuidv4();
    const scheduleParams = [
      scheduleUuid,
      title,
      description || null,
      location,
      startDate,
      endDate,
      "group",
      creatorUuid,
      groupUuid,
    ];
    await connection.query(scheduleQueries.INSERT_SCHEDULE, scheduleParams);
    await connection.query(scheduleQueries.INSERT_SCHEDULE_MEMBER, [scheduleUuid, creatorUuid]);
    console.log(`[createTravelVote] 일정 및 일정 멤버 등록 완료: ${scheduleUuid}`);

    // 투표 생성 (UUID 명시적으로 생성)
    const voteUuid = uuidv4();
    const voteParams = [
      voteUuid,
      groupUuid,
      creatorUuid,
      title,
      location,
      startDate,
      endDate,
      headcount || null,
      description || null,
      voteDeadline,
      scheduleUuid,
    ];
    await connection.query(voteQueries.INSERT_TRAVEL_VOTE_WITH_TITLE_AND_SCHEDULE, voteParams);
    console.log(`[createTravelVote] 투표 등록 완료: ${voteUuid}`);

    // 참여자 등록
    await connection.query(voteQueries.INSERT_TRAVEL_VOTE_PARTICIPANT, [voteUuid, creatorUuid]);
    console.log(`[createTravelVote] 생성자 ${creatorUuid} 투표 참여자로 등록`);

    // 채팅방 생성 또는 조회
    const [existingRooms] = await connection.query(
      `SELECT uuid FROM chat_rooms WHERE schedule_uuid = ? AND type = 'schedule'`,
      [scheduleUuid],
    );
    let chatRoomUuid;
    if (existingRooms.length > 0) {
      chatRoomUuid = existingRooms[0].uuid;
    } else {
      chatRoomUuid = uuidv4();
      await connection.query(
        `INSERT INTO chat_rooms (uuid, type, schedule_uuid) VALUES (?, 'schedule', ?)`,
        [chatRoomUuid, scheduleUuid],
      );
      console.log(`[createTravelVote] 채팅방 생성 완료: ${chatRoomUuid}`);
    }

    // 트랜잭션 커밋
    await connection.commit();
    console.log(`[createTravelVote] 트랜잭션 커밋 완료`);

    return {
      uuid: voteUuid,
      schedule_uuid: scheduleUuid,
      chat_room_uuid: chatRoomUuid,
    };
  } catch (error) {
    await connection.rollback();
    console.error(`[createTravelVote] 트랜잭션 롤백 - ${error.message}`);
    throw new Error(`투표 생성 트랜잭션 실패: ${error.message}`);
  } finally {
    connection.release();
  }
};

module.exports = {
  createTravelVote,
};
