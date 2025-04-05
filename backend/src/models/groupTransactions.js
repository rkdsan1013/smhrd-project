// /backend/src/models/groupTransactions.js
const groupQueries = require("./groupQueries");

const createGroupTransaction = async (
  dbPool,
  { groupUuid, name, description, visibility, groupIconUrl, groupPictureUrl, groupLeaderUuid },
) => {
  // 풀에서 연결(Connection)을 가져와 트랜잭션 실행
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 그룹 정보 삽입
    await connection.query(groupQueries.INSERT_GROUP_INFO, [
      groupUuid,
      name,
      description,
      groupIconUrl,
      groupPictureUrl,
      visibility,
      groupLeaderUuid,
    ]);

    // 그룹 멤버 테이블에 그룹 리더 등록
    await connection.query(groupQueries.INSERT_GROUP_MEMBER, [groupUuid, groupLeaderUuid]);

    await connection.commit();

    // 생성된 그룹 정보 조회 및 반환
    const [rows] = await connection.query(groupQueries.SELECT_GROUP_BY_UUID, [groupUuid]);
    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { createGroupTransaction };
