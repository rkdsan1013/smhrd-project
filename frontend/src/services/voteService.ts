// /frontend/src/services/voteService.ts

import { get, post } from "./apiClient";

interface CreateTravelVoteData {
  location: string;
  startDate: string;
  endDate: string;
  headcount?: number;
  description?: string;
  voteDeadline: string;
}

interface TravelVote {
  uuid: string;
  location: string;
  start_date: string;
  end_date: string;
  headcount?: number;
  description?: string;
  vote_deadline: string;
  is_confirmed: boolean;
  participant_count: number;
  has_participated: boolean;
}

export const createTravelVote = async (
  groupUuid: string,
  data: CreateTravelVoteData,
): Promise<TravelVote> => {
  return post<TravelVote>(`/votes/${groupUuid}`, data);
};

export const getTravelVotes = async (groupUuid: string): Promise<TravelVote[]> => {
  return get<TravelVote[]>(`/votes/${groupUuid}`);
};

export const participateInTravelVote = async (
  voteUuid: string,
  participate: boolean,
): Promise<{ message: string }> => {
  return post<{ message: string }>(`/votes/${voteUuid}/participate`, { participate });
};
