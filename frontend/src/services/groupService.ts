import { get, post, put } from "./apiClient";

export interface CreateGroupPayload {
  name: string;
  description: string;
  groupIcon?: File | null;
  groupPicture?: File | null;
  visibility: "public" | "private";
}

export interface UpdateGroupPayload {
  uuid: string;
  name: string;
  description: string;
  groupIcon?: File | null;
  groupPicture?: File | null;
  visibility: "public" | "private";
}

export interface GroupInfo {
  uuid: string;
  name: string;
  description?: string;
  group_icon?: string; // 그룹 아이콘 URL; 아이콘은 UI에서 동그라미(원)로 표시
  group_picture?: string; // 그룹 사진 URL; 사진은 UI에서 사각형으로 표시하며, 없을 경우 기본 회색 배경 적용
  visibility: "public" | "private";
  group_leader_uuid?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  uuid: string;
  name: string;
  profilePicture?: string;
}

export interface GroupMembersResponse {
  members: Member[];
}

// 그룹 생성 함수 (새 그룹 등록)
export const createGroup = async (payload: CreateGroupPayload): Promise<GroupInfo> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("visibility", payload.visibility);

  if (payload.groupIcon) {
    formData.append("groupIcon", payload.groupIcon);
  }
  if (payload.groupPicture) {
    formData.append("groupPicture", payload.groupPicture);
  }

  return post<GroupInfo>("/groups", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 그룹 수정 함수 (기존 그룹정보를 업데이트)
// 그룹 아이콘과 그룹 사진 변경 시 파일 업로드 그대로 진행하며,
// 수정 후 UI에서는 group_icon(동그라미)와 group_picture(사각형) 영역에 표시되며,
// 만약 해당 값이 없으면 기본 회색 배경이 적용되도록 처리합니다.
export const updateGroup = async (payload: UpdateGroupPayload): Promise<GroupInfo> => {
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  formData.append("visibility", payload.visibility);

  if (payload.groupIcon) {
    formData.append("groupIcon", payload.groupIcon);
  }
  if (payload.groupPicture) {
    formData.append("groupPicture", payload.groupPicture);
  }

  return put<GroupInfo>(`/groups/${payload.uuid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const getMyGroups = async (): Promise<GroupInfo[]> => {
  return get<GroupInfo[]>("/groups/my");
};

export const searchGroups = async (keyword: string): Promise<GroupInfo[]> => {
  return post<GroupInfo[]>("/groups/search", { name: keyword });
};

export const respondToGroupInvite = async (
  inviteUuid: string,
  action: "accept" | "decline",
): Promise<{ message: string }> => {
  return post<{ message: string }>("/groups/invite/respond", {
    inviteUuid,
    action,
  });
};

// joinGroup는 소켓 이벤트로 처리하므로 별도의 HTTP API 함수는 사용하지 않습니다.
export const getGroupMembers = async (groupUuid: string): Promise<GroupMembersResponse> => {
  return get<GroupMembersResponse>(`/groups/${groupUuid}/members`);
};

// ★ 그룹 채팅방 UUID 조회 함수 추가
export const getGroupChatRoomUuid = async (
  groupUuid: string,
): Promise<{ chat_room_uuid: string }> => {
  return get<{ chat_room_uuid: string }>(`/groups/${groupUuid}/chatroom`);
};
