// /components/PopularTravelDestinations.tsx

import React, { useState, useEffect } from "react";
import travelService from "../services/travelService";
import Icons from "./Icons";
import DestinationMap from "./DestinationMap"; // ✅ 지도 컴포넌트 분리 후 import

// ✅ 여행지 타입 정의
interface TravelDestination {
  travelRank: number;
  destinationName: string;
  locationAddress: string;
  trendingTags: string | string[];
}

const PopularDestinations: React.FC = () => {
  // ✅ 상태 선언
  const [destinations, setDestinations] = useState<TravelDestination[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAll, setShowAll] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<TravelDestination | null>(null); // ✅ 클릭된 여행지

  // ✅ 여행지 리스트 가져오기
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await travelService.fetchTravelDestinations();
        setDestinations(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // ✅ 표시할 여행지 (7개 제한 또는 전체)
  const displayDestinations = showAll ? destinations : destinations.slice(0, 7);

  // ✅ 해시태그 포맷팅
  const formatTags = (tags: string | string[]): string[] => {
    try {
      if (Array.isArray(tags)) return tags.map((tag) => `#${tag.trim()}`);
      return tags
        .replace(/[\[\]']+/g, "")
        .split(",")
        .map((tag) => `#${tag.trim()}`)
        .filter(Boolean);
    } catch {
      return [];
    }
  };

  // ✅ 순위에 따른 배경색
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-pink-300 text-white";
      case 2:
        return "bg-blue-200 text-white";
      case 3:
        return "bg-yellow-200 text-white";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="w-full h-full flex flex-col items-start justify-start text-left rounded-xl shadow-sm bg-white p-4 font-[Jua]">
      {/* ✅ 헤더 */}
      <div className="flex justify-between items-center w-full mb-5 mt-4">
        <h3 className="font-bold text-lg text-gray-800 flex items-center gap-1">
          <Icons name="fire" className="w-6 h-6 text-pink-400 animate-pulse" />
          지금 뜨는 여행지
        </h3>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-blue-700 text-sm hover:underline flex items-center gap-1"
        >
          {showAll ? "접기" : "더 보기"}{" "}
          <Icons name="chevronDown" className="w-4 h-4 text-blue-700" />
        </button>
      </div>

      {/* ✅ 리스트 로딩/에러/데이터 표시 */}
      {loading ? (
        <div className="flex-1 w-full flex items-center justify-center">
          <Icons name="spinner" className="w-8 h-8 text-pink-400 animate-spin" />
          <span className="ml-2 text-gray-500 text-sm">로딩 중이에요...</span>
        </div>
      ) : error ? (
        <div className="flex-1 w-full flex items-center justify-center text-red-500">{error}</div>
      ) : (
        <div className="flex-1 w-full overflow-y-auto pr-1 h-full mt-1 no-scrollbar">
          <ul className="w-full divide-y divide-gray-200">
            {/* ✅ 리스트 순회 */}
            {displayDestinations.map((d) => (
              <React.Fragment key={d.travelRank}>
                {/* ✅ 여행지 항목 */}
                <li
                  onClick={() =>
                    setSelectedDestination(
                      selectedDestination?.travelRank === d.travelRank ? null : d,
                    )
                  }
                  className="cursor-pointer py-2.5 hover:bg-blue-50 hover:scale-[1.02] transition-all duration-300 rounded-lg px-2 flex items-start group"
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 text-xs mt-1 ${getRankColor(
                      d.travelRank,
                    )} shadow-sm font-semibold`}
                  >
                    {d.travelRank}
                  </span>
                  <div className="flex-1">
                    <span className="font-medium block text-gray-800">{d.destinationName}</span>
                    <div className="flex items-center gap-1 text-gray-500 text-xs mt-1/2">
                      <Icons
                        name="locationMarker"
                        className="w-4 h-4 text-gray-500 group-hover:animate-bounce"
                      />
                      <span>{d.locationAddress}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formatTags(d.trendingTags).map((tag, index) => (
                        <span
                          key={index}
                          className="text-blue-500 text-xs bg-blue-100 rounded-full px-2 py-0.5 font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>

                {/* ✅ 해당 항목이 선택되었을 경우 → 그 아래 지도 표시 */}
                {selectedDestination?.travelRank === d.travelRank && (
                  <li className="py-3 px-2">
                    <DestinationMap address={d.locationAddress} />
                  </li>
                )}
              </React.Fragment>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default PopularDestinations;
