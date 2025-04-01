// /frontend/src/services/voteService.ts
import { post, get } from "./apiClient";

// 투표 생성 요청 데이터 인터페이스
export interface CreateVoteRequest {
  groupUuid: string;
  type: "MULTI" | "SIMPLE";
  title: string;
  content?: string;
  options?: string[];
  endDate?: string;
}

// 투표 생성 응답 인터페이스
export interface CreateVoteResponse {
  success: boolean;
  voteUuid: string;
  message: string;
}

// 투표 정보 인터페이스
export interface VoteResponse {
  success: boolean;
  vote: {
    uuid: string;
    group_uuid: string;
    type: "MULTI" | "SIMPLE";
    title: string;
    content: string | null;
    created_at: string;
    options?: { uuid: string; text: string; votes: number }[];
    participants?: { user_uuid: string; name: string; profile_picture: string | null }[];
    participantsCount?: number;
  };
}

// MULTI 투표 참여 요청 데이터
export interface VoteMultiRequest {
  optionUuid: string;
}

// 투표 생성
export const createVote = async (data: CreateVoteRequest): Promise<CreateVoteResponse> => {
  return post<CreateVoteResponse>("/votes", data, { withCredentials: true });
};

// 투표 조회
export const fetchVote = async (voteUuid: string): Promise<VoteResponse> => {
  return get<VoteResponse>(`/votes/info/${voteUuid}`, { withCredentials: true });
};

// MULTI 투표 참여
export const voteMulti = async (
  voteUuid: string,
  data: VoteMultiRequest,
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(`/votes/vote/${voteUuid}`, data, {
    withCredentials: true,
  });
};

// SIMPLE 투표 참여
export const participateSimple = async (
  voteUuid: string,
): Promise<{ success: boolean; message: string }> => {
  return post<{ success: boolean; message: string }>(
    `/votes/participate/${voteUuid}`,
    {},
    { withCredentials: true },
  );
};
