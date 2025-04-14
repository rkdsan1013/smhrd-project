// /frontend/src/services/surveyService.ts

import { post } from "./apiClient";

// 설문 요청 데이터 타입 정의
interface SurveyRequest {
  user_uuid: string; // 사용자 UUID
  activity_type: number; // 활동 유형 (1=맛집탐방 2=액티비티, 3=휴양, 4=문화/역사 체험)
  budget_type: number; // 예산 유형 (1=가성비, 2=가심비, 3=럭셔리)
  trip_duration: number; // 여행 기간 (1=당일치기, 2=7일 미만, 3=7일 이상)
}

// 백엔드 응답 타입 정의
interface SurveyResponse {
  success: boolean; // 성공 여부
  message: string; // 응답 메시지 (예: "설문 저장 성공")
}

/**
 * 설문 데이터를 백엔드에 제출하는 함수
 * @param surveyData - 모달에서 수집된 설문 데이터
 * @returns 백엔드에서 받은 응답
 */
export const submitSurvey = async (surveyData: SurveyRequest): Promise<SurveyResponse> => {
  const response = await post<SurveyResponse>("/surveys", surveyData); // [수정] 헤더 생략, apiClient에서 처리
  return response; // 백엔드 응답 반환
};
