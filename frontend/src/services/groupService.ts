// /frontend/src/services/groupService.ts
import { get, post } from "./apiClient";

// 그룹 생성에 필요한 페이로드 타입
export interface CreateGroupPayload {
  name: string;
  description: string;
  groupIcon?: File | null;
  groupPicture?: File | null;
  visibility: "public" | "private";
}

// 그룹 정보 타입
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

// 그룹 생성 API 호출 함수 (POST /groups)
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
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// 내가 가입한 그룹 리스트 API 호출 함수 (GET /groups/my)
export const getMyGroups = async (): Promise<GroupInfo[]> => {
  return get<GroupInfo[]>("/groups/my");
};
