// /backend/src/models/friendTransactions.js

// 친구 요청 수락 기능은 트랜잭션을 사용하여 처리함
const acceptFriendRequest = async (dbPool, receiverUuid, requesterUuid) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // pending 상태의 친구 요청이 존재하는지 확인 (요청 쪽: requesterUuid에서 receiverUuid로)
    const [rows] = await connection.query(
      `SELECT * FROM friends WHERE user_uuid = ? AND friend_uuid = ? AND status = 'pending'`,
      [requesterUuid, receiverUuid],
    );

    if (!rows || rows.length === 0) {
      await connection.rollback();
      return false;
    }

    // 요청을 accepted 상태로 업데이트
    await connection.query(
      `UPDATE friends SET status = 'accepted' WHERE user_uuid = ? AND friend_uuid = ?`,
      [requesterUuid, receiverUuid],
    );

    // 양방향 친구 관계 형성을 위해 반대 방향 데이터 INSERT (중복 방지 처리)
    await connection.query(
      `INSERT IGNORE INTO friends (user_uuid, friend_uuid, status) VALUES (?, ?, 'accepted')`,
      [receiverUuid, requesterUuid],
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = {
  acceptFriendRequest,
};
