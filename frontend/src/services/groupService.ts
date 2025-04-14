import { get, post, put, remove } from "./apiClient";

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
  console.log("Token before request:", window.localStorage.getItem("token"));
  const formData = new FormData();
  formData.append("name", payload.name);
  formData.append("description", payload.description);
  if (payload.groupIcon) formData.append("groupIcon", payload.groupIcon);
  if (payload.groupPicture) formData.append("groupPicture", payload.groupPicture);
  formData.append("visibility", payload.visibility);
  formData.append("survey", JSON.stringify(payload.survey));
  console.log("FormData:", Object.fromEntries(formData));
  return await post<GroupInfo>("/groups", formData);
};

export const updateGroup = async (payload: UpdateGroupPayload): Promise<GroupInfo> => {
  const formData = buildGroupFormData(payload);
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
  return post<{ message: string }>("/groups/invite/respond", { inviteUuid, action });
};

export const getGroupMembers = async (groupUuid: string): Promise<GroupMembersResponse> => {
  return get<GroupMembersResponse>(`/groups/${groupUuid}/members`);
};

export const getGroupChatRoomUuid = async (
  groupUuid: string,
): Promise<{ chat_room_uuid: string }> => {
  return get<{ chat_room_uuid: string }>(`/groups/${groupUuid}/chatroom`);
};

export const getSentGroupInvites = async (
  groupUuid: string,
): Promise<{ invitedUserUuid: string; inviteUuid: string }[]> => {
  return get(`/groups/${groupUuid}/invites/sent`);
};

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

export const getGroupDetails = async (groupUuid: string): Promise<GroupInfo> => {
  return get<GroupInfo>(`/groups/${groupUuid}`);
};

export const leaveGroup = async (groupUuid: string): Promise<{ message: string }> => {
  return remove<{ message: string }>(`/groups/${groupUuid}/members`);
};
