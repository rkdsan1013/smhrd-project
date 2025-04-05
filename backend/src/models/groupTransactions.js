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

    // INSERT_GROUP_INFO를 사용하여 그룹 정보 삽입
    await connection.query(groupQueries.INSERT_GROUP_INFO, [
      name,
      description,
      groupIconUrl, // 파일 업로드가 없으면 null
      groupPictureUrl, // 파일 업로드가 없으면 null
      visibility,
      groupLeaderUuid,
    ]);

    // 그룹 리더에 대해 가장 최근 생성된 그룹을 조회합니다.
    const [rows] = await connection.query(groupQueries.SELECT_LATEST_GROUP_BY_LEADER, [
      groupLeaderUuid,
    ]);
    if (!rows || rows.length === 0) {
      throw new Error("그룹 생성 후 그룹 조회에 실패했습니다.");
    }
    const group = rows[0];

    // 그룹 멤버 테이블에 그룹 리더 등록
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
