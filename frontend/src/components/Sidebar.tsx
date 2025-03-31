import React, { useState, useEffect } from "react";

interface Group {
  id: number;
  image: string;
}

// API 호출 실패 시 사용할 더미 그룹 데이터
const dummyGroups: Group[] = [
  { id: 1, image: "https://via.placeholder.com/50/FF5733" },
  { id: 2, image: "https://via.placeholder.com/50/33FF57" },
  { id: 3, image: "https://via.placeholder.com/50/3357FF" },
];

const Sidebar: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/groups");
        if (!response.ok) {
          throw new Error("Failed to fetch groups");
        }
        const data: { groups: Group[] } = await response.json();
        setGroups(data.groups);
      } catch (err) {
        console.error("Error fetching groups:", err);
        setError("그룹 데이터를 불러오지 못했습니다. 더미 데이터를 사용합니다.");
        setGroups(dummyGroups);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // 네비게이션 핸들러 (추후 react-router 등으로 대체 가능)
  const navigateTo = (destination: string) => {
    alert(destination);
  };

  return (
    <aside className="w-64 bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col space-y-6">
        {/* 상단: 홈 버튼 */}
        <div className="flex-shrink-0">
          <button
            onClick={() => navigateTo("홈 화면으로 이동!")}
            title="홈"
            className="w-full flex items-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
            <span className="ml-3">홈</span>
          </button>
        </div>

        {/* 중앙: 그룹 리스트 영역 */}
        <div className="flex-grow overflow-y-auto">
          {isLoading && <div className="text-center text-sm text-gray-500">로딩 중...</div>}
          {error && !isLoading && <div className="text-center text-sm text-red-500">{error}</div>}
          {!isLoading && !error && groups.length === 0 && (
            <div className="text-center text-sm text-gray-500">그룹이 없습니다.</div>
          )}
          <div className="flex flex-col gap-4 mt-4">
            {groups.map((group) => (
              <button
                key={group.id}
                onClick={() => navigateTo(`그룹 ${group.id} 페이지로 이동!`)}
                title={`그룹 ${group.id}`}
                className="flex items-center space-x-3 hover:opacity-80 focus:outline-none"
              >
                <img
                  src={group.image || "/path/to/default-group.jpg"}
                  alt={`그룹 ${group.id}`}
                  className="w-10 h-10 rounded-full object-cover"
                />
                <span>그룹 {group.id}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 하단: 추가 네비게이션 버튼들 */}
        <div className="flex flex-col space-y-4">
          <button
            onClick={() => navigateTo("그룹 생성 화면으로 이동!")}
            title="그룹 생성"
            className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z"
                clipRule="evenodd"
              />
            </svg>
            <span>그룹 생성</span>
          </button>
          <button
            onClick={() => navigateTo("그룹 검색 화면으로 이동!")}
            title="그룹 찾기"
            className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z"
                clipRule="evenodd"
              />
            </svg>
            <span>그룹 찾기</span>
          </button>
          <button
            onClick={() => navigateTo("사진첩 페이지로 이동!")}
            title="사진첩"
            className="flex items-center space-x-3 text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path
                fillRule="evenodd"
                d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061ZM13.125 8.94a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
                clipRule="evenodd"
              />
            </svg>
            <span>사진첩</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
