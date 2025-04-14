// frontend/src/services/travelService.ts

interface TravelDestination {
  travelRank: number;
  destinationName: string;
  locationAddress: string;
  trendingTags: string;
}

// 인기 여행지 데이터를 가져오는 함수
const fetchTravelDestinations = async (): Promise<TravelDestination[]> => {
  try {
    console.log("Fetching travel destinations from API...");
    const response = await fetch("http://localhost:5000/api/popular-travel-destinations");

    // HTTP 에러 체크
    if (!response.ok) {
      console.error(`HTTP error: ${response.status} ${response.statusText}`);
      throw new Error(
        response.statusText || "인기 여행지 데이터를 불러오는 중 오류가 발생했습니다.",
      );
    }

    const data: TravelDestination[] = await response.json();
    console.log("Data fetched successfully:", data);
    return data;
  } catch (error) {
    // 에러 메시지 처리
    if (error instanceof Error) {
      console.error("Fetch error:", error.message);
      throw new Error(error.message || "알 수 없는 오류가 발생했습니다.");
    }
    throw new Error("알 수 없는 오류가 발생했습니다.");
  }
};

export default {
  fetchTravelDestinations,
};
