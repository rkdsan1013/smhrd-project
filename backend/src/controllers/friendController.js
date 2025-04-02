exports.getFriends = async (req, res) => {
  try {
    const { uuid } = req.params;
    if (!uuid) {
      return res.status(400).json({ success: false, message: "유효한 uuid를 제공해주세요." });
    }

    const friendUuids = await userModel.getFriendsByUuid(uuid); // [{ uuid }, ...]
    if (!friendUuids || friendUuids.length === 0) {
      return res.status(404).json({ success: false, message: "친구 목록을 찾을 수 없습니다." });
    }

    // 각 친구의 uuid로 프로필 조회
    const friends = await Promise.all(
      friendUuids.map(async (friend) => {
        const profile = await userModel.getProfileByUuid(friend.uuid);
        return {
          uuid: profile.uuid,
          name: profile.name,
          profile_picture: profile.profile_picture || null, // 이미 formatProfile 있음
        };
      }),
    );

    res.json({ success: true, friends });
  } catch (error) {
    console.error("[getFriends] Error:", error);
    res.status(500).json({ success: false, message: "서버 오류가 발생했습니다." });
  }
};
