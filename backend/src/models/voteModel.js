// /backend/src/models/voteModel.js
const pool = require("../config/db");

const voteModel = {
  // 투표 생성 (MULTI/SIMPLE)
  createVote: async (groupUuid, type, title, content = null, options = [], endDate = null) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 투표 삽입
      const voteSql = `
        INSERT INTO votes (uuid, group_uuid, type, title, content, end_date)
        VALUES (UUID(), :groupUuid, :type, :title, :content, :endDate)
      `;
      await conn.query(voteSql, { groupUuid, type, title, content, endDate });

      // 생성된 UUID 조회
      const [uuidRows] = await conn.query(
        `
        SELECT uuid
        FROM votes
        WHERE group_uuid = :groupUuid AND title = :title
        ORDER BY created_at DESC LIMIT 1
      `,
        { groupUuid, title },
      );
      const voteUuid = uuidRows[0].uuid;

      // MULTI 투표 옵션 추가
      if (type === "MULTI" && options.length > 0) {
        const optionSql = `
          INSERT INTO vote_options (uuid, vote_uuid, text)
          VALUES (UUID(), :voteUuid, :text)
        `;
        for (const optionText of options) {
          await conn.query(optionSql, { voteUuid, text: optionText });
        }
      }

      await conn.commit();
      return voteUuid;
    } catch (err) {
      await conn.rollback();
      throw new Error(`투표 생성 실패: ${err.message}`);
    } finally {
      conn.release();
    }
  },

  // 투표 조회
  getVote: async (voteUuid) => {
    const voteSql = `
      SELECT uuid, group_uuid, type, title, content, created_at, end_date
      FROM votes
      WHERE uuid = :voteUuid
    `;
    const [voteRows] = await pool.query(voteSql, { voteUuid });
    if (!voteRows[0]) return null;

    const vote = voteRows[0];
    if (vote.type === "MULTI") {
      const optionsSql = `
        SELECT uuid, text, votes
        FROM vote_options
        WHERE vote_uuid = :voteUuid
      `;
      const [optionsRows] = await pool.query(optionsSql, { voteUuid });
      vote.options = optionsRows;
    } else if (vote.type === "SIMPLE") {
      const participantsSql = `
        SELECT vp.user_uuid, up.name, up.profile_picture
        FROM vote_participants vp
        JOIN user_profiles up ON vp.user_uuid = up.uuid
        WHERE vp.vote_uuid = :voteUuid
      `;
      const [participantsRows] = await pool.query(participantsSql, { voteUuid });
      vote.participants = participantsRows;
      vote.participantsCount = participantsRows.length;
    }
    return vote;
  },

  // MULTI 투표 참여
  voteMulti: async (voteUuid, userUuid, optionUuid) => {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      // 중복 투표 체크
      const checkSql = `
        SELECT * FROM vote_participants
        WHERE vote_uuid = :voteUuid AND user_uuid = :userUuid
      `;
      const [checkRows] = await conn.query(checkSql, { voteUuid, userUuid });
      if (checkRows.length > 0) throw new Error("이미 투표했습니다.");

      // 투표 수 증가
      const [updateRows] = await conn.query(
        `
        UPDATE vote_options
        SET votes = votes + 1
        WHERE uuid = :optionUuid AND vote_uuid = :voteUuid
      `,
        { optionUuid, voteUuid },
      );
      if (updateRows.affectedRows === 0) throw new Error("유효하지 않은 옵션입니다.");

      // 참여 기록
      await conn.query(
        `
        INSERT INTO vote_participants (vote_uuid, user_uuid, option_uuid)
        VALUES (:voteUuid, :userUuid, :optionUuid)
      `,
        { voteUuid, userUuid, optionUuid },
      );

      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw new Error(`투표 참여 실패: ${err.message}`);
    } finally {
      conn.release();
    }
  },

  // SIMPLE 투표 참여
  participateSimple: async (voteUuid, userUuid) => {
    const checkSql = `
      SELECT * FROM vote_participants
      WHERE vote_uuid = :voteUuid AND user_uuid = :userUuid
    `;
    const [checkRows] = await pool.query(checkSql, { voteUuid, userUuid });
    if (checkRows.length > 0) throw new Error("이미 참여했습니다.");

    await pool.query(
      `
      INSERT INTO vote_participants (vote_uuid, user_uuid)
      VALUES (:voteUuid, :userUuid)
    `,
      { voteUuid, userUuid },
    );
  },
};

module.exports = voteModel;
