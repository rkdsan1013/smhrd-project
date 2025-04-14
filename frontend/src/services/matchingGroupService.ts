// /frontend/src/services/matchingGroupService.ts

import { get } from "./apiClient";

// 그룹 정보 인터페이스 확장
export interface MatchingGroupInfo {
  uuid: string;
  name: string;
  description?: string;
  group_icon?: string;
  group_picture?: string;
  group_leader_uuid?: string;
}

// 추천 매칭 그룹 가져오기 (단순화)
export const getMatchingGroups = async (userUuid: string): Promise<MatchingGroupInfo[]> => {
  try {
    console.log("getMatchingGroups 요청 시작");

    // 별도 파라미터 없이 기본 API 경로만 사용
    const data = await get<MatchingGroupInfo[]>("/matching/recommend");
    console.log("추천 그룹 데이터:", data);
    return data || [];
  } catch (error) {
    console.error("getMatchingGroups 오류:", error);
    throw error;
  }
};
