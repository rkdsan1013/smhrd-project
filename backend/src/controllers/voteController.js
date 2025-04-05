// /backend/src/controllers/voteController.js
const voteModel = require("../models/voteModel");

const voteController = {
  // 투표 생성
  createVote: async (req, res) => {
    try {
      const { groupUuid, type, title, content, options, endDate } = req.body; // endDate 추가
      if (!groupUuid || !type || !title || !["MULTI", "SIMPLE"].includes(type)) {
        return res
          .status(400)
          .json({ success: false, message: "필수 필드가 누락되었거나 유효하지 않습니다." });
      }
      if (type === "MULTI" && (!options || !Array.isArray(options) || options.length < 2)) {
        return res
          .status(400)
          .json({ success: false, message: "MULTI 투표는 최소 2개 이상의 옵션이 필요합니다." });
      }
      // endDate 유효성 검사 (선택적 필드이므로 없어도 허용)
      if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        return res
          .status(400)
          .json({ success: false, message: "endDate는 YYYY-MM-DD 형식이어야 합니다." });
      }

      const voteUuid = await voteModel.createVote(
        groupUuid,
        type,
        title,
        content,
        options,
        endDate,
      );
      res.status(201).json({ success: true, voteUuid, message: "투표가 생성되었습니다." });
    } catch (err) {
      console.error("[createVote] 오류:", err.message);
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 투표 조회
  getVote: async (req, res) => {
    try {
      const { uuid } = req.params;
      const vote = await voteModel.getVote(uuid);
      if (!vote) {
        return res.status(404).json({ success: false, message: "투표를 찾을 수 없습니다." });
      }
      res.json({ success: true, vote });
    } catch (err) {
      console.error("[getVote] 오류:", err.message);
      res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
    }
  },

  // MULTI 투표 참여
  voteMulti: async (req, res) => {
    try {
      const { uuid } = req.params;
      const { optionUuid } = req.body;
      const userUuid = req.user.uuid;
      if (!optionUuid) {
        return res.status(400).json({ success: false, message: "옵션 UUID가 필요합니다." });
      }

      await voteModel.voteMulti(uuid, userUuid, optionUuid);
      res.json({ success: true, message: "투표에 참여했습니다." });
    } catch (err) {
      console.error("[voteMulti] 오류:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  },

  // SIMPLE 투표 참여
  participateSimple: async (req, res) => {
    try {
      const { uuid } = req.params;
      const userUuid = req.user.uuid;

      await voteModel.participateSimple(uuid, userUuid);
      res.json({ success: true, message: "투표에 참여했습니다." });
    } catch (err) {
      console.error("[participateSimple] 오류:", err.message);
      res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = voteController;
