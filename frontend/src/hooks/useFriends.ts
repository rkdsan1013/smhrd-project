// /frontend/src/hooks/useFriends.ts
import { useState } from "react";
import { fetchFriends } from "../services/userService";

export interface Friend {
  uuid: string;
  name: string;
}

export const useFriends = (userUuid: string) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFriends = async () => {
    setLoading(true);
    try {
      const response = await fetchFriends(userUuid);
      setFriends(response.friends);
      setError(null);
    } catch (err) {
      setError("친구 목록을 불러오는 데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return { friends, loading, error, loadFriends };
};