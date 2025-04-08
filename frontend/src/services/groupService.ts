import { get, post } from "./apiClient";

export interface CreateGroupPayload {
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
  group_icon?: string;
  group_picture?: string;
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

export const getMyGroups = async (): Promise<GroupInfo[]> => {
  return get<GroupInfo[]>("/groups/my");
};

export const searchGroups = async (keyword: string): Promise<GroupInfo[]> => {
  return post<GroupInfo[]>("/groups/search", { name: keyword });
};

export const getGroupMembers = async (groupUuid: string): Promise<GroupMembersResponse> => {
  return get<GroupMembersResponse>(`/groups/${groupUuid}/members`);
};

// joinGroup는 소켓 이벤트로 처리하므로 이 파일에서는 별도로 HTTP API 함수를 사용하지 않습니다.
