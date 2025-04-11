// /frontend/src/services/scheduleService.ts

import { get, post, put, remove } from "./apiClient";

// 일정 데이터 타입 정의 (다른 필드는 백엔드에서 처리)
// 백엔드에서는 allDay 정보를 저장하지 않으므로, 여기서는 start_time과 end_time을 문자열(ISO)로 관리합니다.
export interface Schedule {
  uuid: string;
  title: string;
  description?: string;
  location?: string;
  start_time: string; // ISO 문자열
  end_time: string; // ISO 문자열
  type: "personal" | "group";
}

const BASE_URL = "/schedules";

/**
 * 백엔드에서 JWT 토큰을 통해 자신의 일정을 반환할 때,
 * { success: true, schedules: Schedule[] } 형태로 응답합니다.
 * 따라서 schedules 프로퍼티를 추출합니다.
 */
export const fetchSchedules = async (): Promise<Schedule[]> => {
  const response = await get<{ success: boolean; schedules: Schedule[] }>(BASE_URL);
  return response.schedules;
};

/**
 * 새로운 일정을 생성합니다.
 * 클라이언트에서는 title, description, location, start_time, end_time, type만 전달합니다.
 */
export const createSchedule = async (scheduleData: Omit<Schedule, "uuid">): Promise<Schedule> => {
  return await post<Schedule>(BASE_URL, scheduleData);
};

/**
 * 기존 일정을 수정합니다.
 */
export const updateSchedule = async (
  uuid: string,
  updateData: Partial<Omit<Schedule, "uuid">>,
): Promise<Schedule> => {
  const url = `${BASE_URL}/${uuid}`;
  return await put<Schedule>(url, updateData);
};

/**
 * 해당 일정을 삭제합니다.
 */
export const deleteSchedule = async (uuid: string): Promise<void> => {
  const url = `${BASE_URL}/${uuid}`;
  return await remove<void>(url);
};

const scheduleService = {
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
};

export default scheduleService;
