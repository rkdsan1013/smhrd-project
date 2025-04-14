import { get, post, put, remove } from "./apiClient";

// 일정 데이터 타입 정의 (다른 필드는 백엔드에서 처리)
export interface Schedule {
  uuid: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string; // ISO 문자열
  end_time: string; // ISO 문자열
  type: "personal" | "group";
}

interface ScheduleChatRoomResponse {
  chat_room_uuid: string;
  title: string;
}

const BASE_URL = "/schedules";

/**
 * 백엔드에서 JWT 토큰을 통해 자신의 일정을 반환할 때,
 * { success: true, schedules: Schedule[] } 형태로 응답합니다.
 * 따라서 여기서는 schedules 프로퍼티를 추출합니다.
 */
export const fetchSchedules = async (): Promise<Schedule[]> => {
  const response = await get<{ success: boolean; schedules: Schedule[] }>(BASE_URL);
  return response.schedules;
};

export const createSchedule = async (scheduleData: Omit<Schedule, "uuid">): Promise<Schedule> => {
  return await post<Schedule>(BASE_URL, scheduleData);
};

export const updateSchedule = async (
  uuid: string,
  updateData: Partial<Omit<Schedule, "uuid">>,
): Promise<Schedule> => {
  const url = `${BASE_URL}/${uuid}`;
  return await put<Schedule>(url, updateData);
};

export const deleteSchedule = async (uuid: string): Promise<void> => {
  const url = `${BASE_URL}/${uuid}`;
  return await remove<void>(url);
};

export const getScheduleChatRoomUuid = async (
  scheduleUuid: string,
): Promise<ScheduleChatRoomResponse> => {
  return get<ScheduleChatRoomResponse>(`/schedules/${scheduleUuid}/chat`);
};

const ScheduleService = {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};

export default ScheduleService;
