import React, { useState, useEffect } from "react";

interface Group {
  uuid: string;
  image: string;
}

const Sidebar: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  // 임시 데이터: group_info 및 group_members 테이블 기준
  const dummyGroups: Group[] = [
    {
      uuid: "00000000-0000-0000-0000-000000000001",
      image: "https://via.placeholder.com/50/FF5733?text=G1",
    },
    {
      uuid: "00000000-0000-0000-0000-000000000002",
      image: "https://via.placeholder.com/50/33FF57?text=G2",
    },
    { uuid: "00000000-0000-0000-0000-000000000003", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000004",
      image: "https://via.placeholder.com/50/FFFF33?text=G4",
    },
    { uuid: "00000000-0000-0000-0000-000000000005", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000006",
      image: "https://via.placeholder.com/50/33FFFF?text=G6",
    },
    { uuid: "00000000-0000-0000-0000-000000000007", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000008",
      image: "https://via.placeholder.com/50/FF33FF?text=G8",
    },
    {
      uuid: "00000000-0000-0000-0000-000000000009",
      image: "https://via.placeholder.com/50/FF5733?text=G9",
    },
    { uuid: "00000000-0000-0000-0000-000000000010", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000011",
      image: "https://via.placeholder.com/50/33FF57?text=G11",
    },
    { uuid: "00000000-0000-0000-0000-000000000012", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000013",
      image: "https://via.placeholder.com/50/FFFF33?text=G13",
    },
    {
      uuid: "00000000-0000-0000-0000-000000000014",
      image: "https://via.placeholder.com/50/FF33FF?text=G14",
    },
    { uuid: "00000000-0000-0000-0000-000000000015", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000016",
      image: "https://via.placeholder.com/50/33FFFF?text=G16",
    },
    { uuid: "00000000-0000-0000-0000-000000000017", image: "" },
    {
      uuid: "00000000-0000-0000-0000-000000000018",
      image: "https://via.placeholder.com/50/FF5733?text=G18",
    },
    {
      uuid: "00000000-0000-0000-0000-000000000019",
      image: "https://via.placeholder.com/50/33FF57?text=G19",
    },
    { uuid: "00000000-0000-0000-0000-000000000020", image: "" },
  ];

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        // 실제 환경에서는 API 호출로 데이터를 받아옵니다.
        setGroups(dummyGroups);
      } catch {
        setGroups([]);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  // 그룹 버튼 클릭 시 (여기서는 alert로 모의)
  const navigateTo = (groupUuid: string) => {
    alert(`그룹 UUID: ${groupUuid}로 이동합니다.`);
  };

  return (
    // 사이드바 폼: 모바일은 전체 폭(w-full), 데스크탑은 고정 폭(md:w-20)
    <aside className="w-full md:w-20 bg-white rounded-lg shadow-lg p-2">
      <div className="flex flex-row md:flex-col h-full">
        {/* 홈 버튼 영역 */}
        <div className="flex-shrink-0 flex items-center justify-center">
          <button
            onClick={() => navigateTo("home")}
            title="홈"
            className="flex items-center justify-center text-gray-700 hover:text-blue-600 focus:outline-none"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-8 h-8"
            >
              <path d="M11.47 3.841a.75.75 0 011.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
            </svg>
          </button>
        </div>

        {/* 구분 라인 – 홈 버튼과 그룹 리스트 사이 */}
        <div className="flex items-center">
          {/* 모바일에서는 세로 구분, 데스크탑은 가로 구분 */}
          <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
          <div className="hidden md:block w-full border-t border-gray-300 my-2" />
        </div>

        {/* 그룹 리스트 영역 – 스크롤 영역은 폼 내부에 고정되어, 경계에 페이드 효과 적용 */}
        <div className="relative flex-grow mx-2 my-1 overflow-hidden">
          <div className="no-scrollbar flex flex-row md:flex-col gap-3 overflow-auto w-full h-full">
            {loading ? (
              <div className="text-center text-xs text-gray-500">Loading...</div>
            ) : groups.length === 0 ? (
              <div className="text-center text-xs text-gray-500">없습니다.</div>
            ) : (
              groups.map((group) => (
                <button
                  key={group.uuid}
                  onClick={() => navigateTo(group.uuid)}
                  title={`그룹 ${group.uuid}`}
                  className="flex items-center justify-center hover:opacity-80 focus:outline-none"
                >
                  {group.image ? (
                    <img
                      src={group.image}
                      alt={`그룹 ${group.uuid}`}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-300" />
                  )}
                </button>
              ))
            )}
          </div>
          {/* 페이드 오버레이 – 스크롤 경계에 고정 (스크롤과는 분리됨) */}
          {/* 모바일: 좌우 오버레이 */}
          <div className="block md:hidden pointer-events-none absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-white to-transparent" />
          <div className="block md:hidden pointer-events-none absolute inset-y-0 right-0 w-4 bg-gradient-to-l from-white to-transparent" />
          {/* 데스크탑: 상하 오버레이 */}
          <div className="hidden md:block pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-white to-transparent" />
          <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-white to-transparent" />
        </div>

        {/* 구분 라인 – 그룹 리스트와 내비게이션 버튼 사이 */}
        <div className="flex items-center">
          <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
          <div className="hidden md:block w-full border-t border-gray-300 my-2" />
        </div>

        {/* 내비게이션 버튼 영역 – 모바일은 가로, 데스크탑은 세로 배열 */}
        <div className="flex flex-row md:flex-col flex-shrink-0 gap-1 items-center justify-center">
          <button
            onClick={() => navigateTo("create-group")}
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
            onClick={() => navigateTo("search-group")}
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
                d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zm-8.25 6a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 9.75z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <button
            onClick={() => navigateTo("photo-album")}
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
