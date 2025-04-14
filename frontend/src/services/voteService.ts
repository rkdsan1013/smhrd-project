import { get, post } from "./apiClient";

interface CreateTravelVoteData {
  title: string;
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
  schedule_uuid?: string;
  group_uuid: string;
}

interface CreateVoteResponse {
  vote_uuid: string;
  schedule_uuid: string;
  chat_room_uuid: string;
}

interface GetTravelVotesResponse {
  votes: TravelVote[];
}

interface ToggleVotePayload {
  voteUuid: string;
  participate: boolean;
}

interface ToggleVoteResponse {
  message: string;
}

export const createTravelVote = async (
  groupUuid: string,
  data: CreateTravelVoteData,
): Promise<CreateVoteResponse> => {
  return post<CreateVoteResponse>("/votes", {
    group_uuid: groupUuid,
    ...data,
  });
};

export const getTravelVotes = async (groupUuid: string): Promise<GetTravelVotesResponse> => {
  const response = await get<GetTravelVotesResponse>(`/votes?group_uuid=${groupUuid}`);
  console.log("[voteService] Raw response:", JSON.stringify(response, null, 2));
  return response;
};

export const toggleVoteParticipation = async (
  voteUuid: string,
  participate: boolean,
): Promise<ToggleVoteResponse> => {
  if (!voteUuid) throw new Error("voteUuid가 없습니다.");
  const payload: ToggleVotePayload = { voteUuid, participate };
  return post<ToggleVoteResponse>(`/votes/${voteUuid}/participate`, payload);
};
