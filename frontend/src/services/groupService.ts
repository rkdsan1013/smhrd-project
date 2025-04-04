// /frontend/src/services/groupService.ts
import { get, post, patch, remove } from "./apiClient";

// 그룹 정보 인터페이스 (group_info 테이블 기준)
export interface Group {
  uuid: string;
  name: string;
  description: string;
  group_picture?: string;
  visibility: "public" | "private";
  group_leader_uuid?: string;
  created_at: string;
  updated_at: string;
}

// 그룹 생성 시 API에 전달할 페이로드(폼 데이터로 전송할 경우 FormData 사용 권장)
export interface CreateGroupPayload {
  name: string;
  description?: string;
  // 이미지 업로드는 FormData에 직접 append 하여 전송하는 것이 좋습니다.
  // group_picture?: File | string;
  visibility?: "public" | "private";
}

// 그룹 수정 시 API에 전달할 페이로드
export interface UpdateGroupPayload {
  name?: string;
  description?: string;
  // 업데이트 시에도 이미지 파일이 포함될 수 있으므로 FormData로 전송하는 것을 권장합니다.
  // group_picture?: File | string;
  visibility?: "public" | "private";
}

// 그룹 생성: FormData 변수에는 그룹 이름, 설명, 이미지 파일, 공개여부 등이 포함되어야 합니다.
export const createGroup = async (formData: FormData): Promise<Group> => {
  return post<Group>("/groups", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 단일 그룹 조회
export const getGroup = async (groupUuid: string): Promise<Group> => {
  return get<Group>(`/groups/${groupUuid}`);
};

// 그룹 목록 조회
export const getGroups = async (): Promise<Group[]> => {
  return get<Group[]>(`/groups`);
};

// 그룹 수정: 일부 정보 업데이트 시 주로 FormData 사용 (이미지 변경 등)
export const updateGroup = async (groupUuid: string, formData: FormData): Promise<Group> => {
  return patch<Group>(`/groups/${groupUuid}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

// 그룹 삭제
export const deleteGroup = async (groupUuid: string): Promise<void> => {
  return remove(`/groups/${groupUuid}`);
};

// 그룹 가입: 보통 가입 API는 POST 메서드로 구현
export const joinGroup = async (groupUuid: string): Promise<void> => {
  return post(`/groups/${groupUuid}/join`);
};

// 그룹 탈퇴
export const leaveGroup = async (groupUuid: string): Promise<void> => {
  return post(`/groups/${groupUuid}/leave`);
};

// 그룹 초대: 초대할 이메일과 초대한 사람의 uuid 등을 전달할 수 있습니다.
export const inviteMember = async (groupUuid: string, invitedEmail: string): Promise<void> => {
  return post(`/groups/${groupUuid}/invite`, { invited_email: invitedEmail });
};
