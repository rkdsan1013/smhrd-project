import React, { useState, useEffect } from "react";

interface Group {
  id: number;
  image: string;
}

const Sidebar: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // 임시 데이터: 20개의 그룹
  const dummyGroups: Group[] = [
    { id: 1, image: "https://via.placeholder.com/50/FF5733?text=G1" },
    { id: 2, image: "https://via.placeholder.com/50/33FF57?text=G2" },
    { id: 3, image: "" },
    { id: 4, image: "https://via.placeholder.com/50/FFFF33?text=G4" },
    { id: 5, image: "" },
    { id: 6, image: "https://via.placeholder.com/50/33FFFF?text=G6" },
    { id: 7, image: "" },
    { id: 8, image: "https://via.placeholder.com/50/FF33FF?text=G8" },
    { id: 9, image: "https://via.placeholder.com/50/FF5733?text=G9" },
    { id: 10, image: "" },
    { id: 11, image: "https://via.placeholder.com/50/33FF57?text=G11" },
    { id: 12, image: "" },
    { id: 13, image: "https://via.placeholder.com/50/FFFF33?text=G13" },
    { id: 14, image: "https://via.placeholder.com/50/FF33FF?text=G14" },
    { id: 15, image: "" },
    { id: 16, image: "https://via.placeholder.com/50/33FFFF?text=G16" },
    { id: 17, image: "" },
    { id: 18, image: "https://via.placeholder.com/50/FF5733?text=G18" },
    { id: 19, image: "https://via.placeholder.com/50/33FF57?text=G19" },
    { id: 20, image: "" },
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        // 실제 API 호출 대신 임시 데이터를 적용 (테스트용)
        setGroups(dummyGroups);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  const navigateTo = (destination: string) => alert(destination);

  return (
    // 모바일: 전체 폭(w-full), 데스크탑(md 이상): 고정 폭(w-20)
    <aside className="w-full md:w-20 bg-white rounded-lg shadow-lg p-3">
      <div className="flex flex-row md:flex-col h-full">
        {/* 홈 버튼 영역 */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <button
            onClick={() => navigateTo("홈 화면으로 이동!")}
            title="홈"
            className="flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            {/* 기존 홈 아이콘: 두 개의 <path> 요소 */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
          </button>
        </div>

        {/* 구분 라인: 데스크탑은 수평, 모바일은 수직 */}
        <div className="hidden md:block w-full border-t border-gray-300 my-4"></div>
        <div className="block md:hidden h-full border-l border-gray-300 mx-4"></div>

        {/* 그룹 리스트 영역 */}
        {/* 데스크탑: flex-col (아이템 위쪽부터 채우며 가로 가운데 정렬),
            모바일: flex-row (아이템 좌측부터 채우며 세로 가운데 정렬) */}
        <div className="no-scrollbar flex flex-row md:flex-col flex-grow gap-2 my-4 overflow-auto items-center justify-start">
          {loading ? (
            <div className="text-center text-xs text-gray-500">Loading...</div>
          ) : groups.length === 0 ? (
            <div className="text-center text-xs text-gray-500">없음</div>
          ) : (
            groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigateTo(`그룹 ${group.id} 페이지로 이동!`)}
                title={`그룹 ${group.id}`}
                className="flex items-center justify-center hover:opacity-80 focus:outline-none"
              >
                {group.image ? (
                  <img
                    src={group.image}
                    alt={`그룹 ${group.id}`}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300" />
                )}
              </button>
            ))
          )}
        </div>

        {/* 구분 라인: 그룹 리스트와 네비게이션 영역 사이 */}
        <div className="hidden md:block w-full border-t border-gray-300 my-4"></div>
        <div className="block md:hidden h-full border-l border-gray-300 mx-4"></div>

        {/* 하단 네비게이션 버튼 영역 */}
        {/* 데스크탑: flex-col (위쪽부터 채움), 모바일: flex-row (좌측부터 채우며 세로는 가운데 정렬) */}
        <div className="flex flex-row md:flex-col flex-shrink-0 gap-2 items-center justify-center">
          <button
            onClick={() => navigateTo("그룹 생성 화면으로 이동!")}
            title="그룹 생성"
            className="flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 01.75.75v6.75h6.75a.75.75 0 110 1.5h-6.75v6.75a.75.75 0 01-1.5 0v-6.75H4.5a.75.75 0 010-1.5h6.75V4.5a.75.75 0 01.75-.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => navigateTo("그룹 검색 화면으로 이동!")}
            title="그룹 검색"
            className="flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => navigateTo("사진첩 페이지로 이동!")}
            title="사진첩"
            className="flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zm2.25-.75a.75.75 0 00-.75.75v12a.75.75 0 00.75.75h16.5a.75.75 0 00.75-.75V6a.75.75 0 00-.75-.75H3.75z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061z"
                clipRule="evenodd"
              />
              <path
                fillRule="evenodd"
                d="M13.125 8.94a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
