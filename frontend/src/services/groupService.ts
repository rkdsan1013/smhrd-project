// /frontend/src/services/groupService.ts

import { get, post, put } from "./apiClient";

// 그룹 생성 페이로드 인터페이스
export interface CreateGroupPayload {
  name: string;
  description: string;
  groupIcon?: File | null;
  groupPicture?: File | null;
  visibility: "public" | "private";
}

// 그룹 수정 페이로드 인터페이스
export interface UpdateGroupPayload {
  uuid: string;
  name: string;
  description: string;
  groupIcon?: File | null;
  groupPicture?: File | null;
  visibility: "public" | "private";
}

// 그룹 정보 인터페이스
export interface GroupInfo {
  uuid: string;
  name: string;
  description?: string;
  group_icon?: string; // 그룹 아이콘 URL, UI에서 동그라미로 표시
  group_picture?: string; // 그룹 사진 URL, UI에서 사각형으로 표시; 없으면 기본 회색 배경 적용
  visibility: "public" | "private";
  group_leader_uuid?: string;
  created_at: string;
  updated_at: string;
}

// 멤버 인터페이스
export interface Member {
  uuid: string;
  name: string;
  profilePicture?: string;
}

// 그룹 멤버 응답 인터페이스
export interface GroupMembersResponse {
  members: Member[];
}

// 내부 헬퍼 함수 - FormData 생성
const buildGroupFormData = (data: {
  name: string;
  description: string;
  visibility: "public" | "private";
  groupIcon?: File | null;
  groupPicture?: File | null;
}) => {
  const formData = new FormData();
  formData.append("name", data.name);
  formData.append("description", data.description);
  formData.append("visibility", data.visibility);
  if (data.groupIcon) formData.append("groupIcon", data.groupIcon);
  if (data.groupPicture) formData.append("groupPicture", data.groupPicture);
  return formData;
};

// 그룹 생성 함수 (새 그룹 등록)
// 추가: apiClient에서 post 함수 가져오기
// 설명: fetch 대신 axios를 사용하기 위해 apiClient의 post 함수를 임포트
export const createGroup = async (payload: {
  name: string;
  description: string;
  groupIcon: File | null;
  groupPicture: File | null;
  visibility: "public" | "private";
  survey: {
    activity_type: number;
    budget_type: number;
    trip_duration: number;
  };
}): Promise<GroupInfo> => {
  console.log("Token before request:", window.localStorage.getItem("token")); // 추가: 토큰 확인
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  if (payload.groupIcon) formData.append("groupIcon", payload.groupIcon);
  if (payload.groupPicture) formData.append("groupPicture", payload.groupPicture);
  formData.append("visibility", payload.visibility);
  formData.append("survey", JSON.stringify(payload.survey));
  console.log("FormData:", Object.fromEntries(formData)); // 추가: FormData 확인
  // 수정: fetch를 apiClient의 post 함수로 교체
  // 설명: axiosInstance를 사용해 요청을 보내도록 변경, 인터셉터(예: Authorization 헤더 추가)가 적용됨
  return await post<GroupInfo>("/groups", formData);
};

// 그룹 수정 함수 (기존 그룹 업데이트)
export const updateGroup = async (payload: UpdateGroupPayload): Promise<GroupInfo> => {
  const formData = buildGroupFormData(payload);
  return put<GroupInfo>(`/groups/${payload.uuid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 내 그룹 목록 조회 함수
export const getMyGroups = async (): Promise<GroupInfo[]> => {
  return get<GroupInfo[]>("/groups/my");
};

// 그룹 검색 함수
export const searchGroups = async (keyword: string): Promise<GroupInfo[]> => {
  return post<GroupInfo[]>("/groups/search", { name: keyword });
};

// 그룹 초대 응답 함수
export const respondToGroupInvite = async (
  inviteUuid: string,
  action: "accept" | "decline",
): Promise<{ message: string }> => {
  return post<{ message: string }>("/groups/invite/respond", { inviteUuid, action });
};

// 그룹 멤버 조회 함수
export const getGroupMembers = async (groupUuid: string): Promise<GroupMembersResponse> => {
  return get<GroupMembersResponse>(`/groups/${groupUuid}/members`);
};

// 그룹 채팅방 UUID 조회 함수
export const getGroupChatRoomUuid = async (
  groupUuid: string,
): Promise<{ chat_room_uuid: string }> => {
  return get<{ chat_room_uuid: string }>(`/groups/${groupUuid}/chatroom`);
};

// 내가 보낸 그룹 초대 목록 불러오기
export const getSentGroupInvites = async (
  groupUuid: string,
): Promise<{ invitedUserUuid: string; inviteUuid: string }[]> => {
  return get(`/groups/${groupUuid}/invites/sent`);
};

// 내가 받은 초대 목록 조회
export const getReceivedGroupInvites = async (): Promise<
  {
    inviteUuid: string;
    groupUuid: string;
    inviterUuid: string;
    inviterName: string;
    groupName: string;
  }[]
> => {
  return get("/groups/invites/received");
};
