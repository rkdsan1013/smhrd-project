// /frontend/src/hooks/useFriends.ts

import { useState, useCallback } from "react";
import { fetchFriendList, Friend } from "../services/friendService";

// 친구 목록 상태 관리 custom hook
export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchFriendList();
      setFriends(data);
      setError(null);
    } catch (err) {
      console.error("친구 목록 불러오기 오류:", err);
      setError("친구 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  return { friends, loading, error, loadFriends };
};
