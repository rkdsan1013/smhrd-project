// /backend/src/models/groupTransactions.js

const groupQueries = require("./groupQueries");

const createGroup = async (
  dbPool,
  name,
  description,
  visibility,
  groupLeaderUuid,
  groupIconUrl,
  groupPictureUrl,
) => {
  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 그룹 정보 삽입 (파일 업로드가 없으면 null 값 사용)
    await connection.query(groupQueries.INSERT_GROUP_INFO, [
      name,
      description,
      groupIconUrl,
      groupPictureUrl,
      visibility,
      groupLeaderUuid,
    ]);

    // 그룹 리더가 생성한 가장 최근 그룹 정보 조회
    const [rows] = await connection.query(groupQueries.SELECT_LATEST_GROUP_BY_LEADER, [
      groupLeaderUuid,
    ]);
    if (!rows || rows.length === 0) {
      throw new Error("그룹 생성 후 그룹 조회에 실패했습니다.");
    }
    const group = rows[0];

    // 그룹 멤버 테이블에 그룹 리더 등록 (role: 'leader')
    await connection.query(groupQueries.INSERT_GROUP_MEMBER, [group.uuid, groupLeaderUuid]);

    await connection.commit();
    return group;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { createGroup };
