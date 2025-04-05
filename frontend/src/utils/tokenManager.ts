// /frontend/src/utils/tokenManager.ts

import { refreshTokens } from "../services/authService";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000; // 10분 간격
const ACTIVITY_THRESHOLD_MS = 5 * 60 * 1000; // 5분 이내 활동 기준
const MAX_RETRIES = 3; // 최대 재시도 횟수
const RETRY_DELAY_MS = 2000; // 재시도 간격 (2초)

// 마지막 활동 시간 저장
let lastActivityTimestamp = Date.now();

// 마지막 활동 시간 업데이트 함수
const updateLastActivity = (): void => {
  lastActivityTimestamp = Date.now();
};

// 토큰 갱신을 재시도와 함께 수행하는 함수
const refreshWithRetry = async (
  renewRefresh: boolean,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY_MS,
): Promise<void> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await refreshTokens(renewRefresh);
      console.log(
        `토큰 갱신 성공 (시도 ${attempt + 1}) - mode: ${renewRefresh ? "full" : "access-only"}`,
      );
      return;
    } catch (error) {
      attempt++;
      console.error(`토큰 갱신 실패 (시도 ${attempt})`, error);
      if (attempt > maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

// 토큰 갱신 폴링을 시작하고, 정리(cleanup) 함수를 반환함
const startTokenRefreshPolling = (): (() => void) => {
  const activityEvents = ["mousemove", "keydown", "click", "touchstart"];
  activityEvents.forEach((event) => window.addEventListener(event, updateLastActivity));

  // 페이지 로드 시 즉시 전체 토큰 갱신 시도
  (async () => {
    try {
      await refreshWithRetry(true);
    } catch (error) {
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    }
  })();

  const intervalId = setInterval(async () => {
    const renewRefresh = Date.now() - lastActivityTimestamp < ACTIVITY_THRESHOLD_MS;
    try {
      await refreshWithRetry(renewRefresh);
    } catch (error) {
      window.dispatchEvent(new CustomEvent("userSignedOut"));
    }
  }, REFRESH_INTERVAL_MS);

  return () => {
    clearInterval(intervalId);
    activityEvents.forEach((event) => window.removeEventListener(event, updateLastActivity));
  };
};

export default startTokenRefreshPolling;
