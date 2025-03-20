// /frontend/src/utils/tokenManager.ts
import { refreshTokens } from "../services/authService";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;   // 10분 간격
const ACTIVITY_THRESHOLD_MS = 5 * 60 * 1000;  // 5분 이내 활동 기준
const MAX_RETRIES = 3;                        // 최대 재시도 횟수
const RETRY_DELAY_MS = 2000;                  // 재시도 간격 (2초)

let lastActivityTimestamp = Date.now();

const updateLastActivity = (): void => {
  lastActivityTimestamp = Date.now();
};

const refreshWithRetry = async (
  renewRefresh: boolean,
  maxRetries = MAX_RETRIES,
  delay = RETRY_DELAY_MS
): Promise<void> => {
  let attempt = 0;
  while (attempt <= maxRetries) {
    try {
      await refreshTokens(renewRefresh);
      console.log(`토큰 갱신 성공 (시도 ${attempt + 1}) - mode: ${renewRefresh ? "full" : "access-only"}`);
      return;
    } catch (error) {
      attempt++;
      console.error(`토큰 갱신 실패 (시도 ${attempt})`, error);
      if (attempt > maxRetries) throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const startTokenRefreshPolling = (): (() => void) => {
  const activityEvents = ["mousemove", "keydown", "click"];
  activityEvents.forEach((event) => window.addEventListener(event, updateLastActivity));

  // 페이지 로드 시 즉시 풀 갱신 시도
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