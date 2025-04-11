// /backend/src/models/friendTransactions.js

const acceptFriendRequest = async (dbPool, receiverUuid, requesterUuid) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();
    // pending 상태인 친구 요청이 존재하는지 확인
    const [rows] = await connection.query(
      `SELECT * FROM friendships
       WHERE user1_uuid = LEAST(?, ?)
         AND user2_uuid = GREATEST(?, ?)
         AND status = 'pending'
         AND requester_uuid = ?`,
      [receiverUuid, requesterUuid, receiverUuid, requesterUuid, requesterUuid],
    );
    if (!rows || rows.length === 0) {
      await connection.rollback();
      return false;
    }
    // pending 상태인 요청을 accepted 상태로 업데이트
    await connection.query(
      `UPDATE friendships
       SET status = 'accepted'
       WHERE user1_uuid = LEAST(?, ?)
         AND user2_uuid = GREATEST(?, ?)
         AND status = 'pending'
         AND requester_uuid = ?`,
      [receiverUuid, requesterUuid, receiverUuid, requesterUuid, requesterUuid],
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
