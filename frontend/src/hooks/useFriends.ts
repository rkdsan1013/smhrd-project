import { useState } from "react";
import { fetchFriendList, Friend } from "../services/friendService";

export const useFriends = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const friends = await fetchFriendList();
      setFriends(friends);
      setError(null);
    } catch (err) {
      setError("친구 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return { friends, loading, error, loadFriends };
};
