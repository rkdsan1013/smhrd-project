import React, { useState } from "react";

interface TeamMember {
  id: number;
  name: string;
  userTag: string; // 사용자 태그 (예: @username)
  image?: string; // 프로필 사진 (선택적)
  recentLocation: string; // 최근 방문한 지역
  travelPeriod: string; // 여행 기간
  travelPhoto?: string; // 여행 사진
  travelTags: string[]; // 여행 태그
  bio: string; // 사용자 한마디
}

const TeamMemberModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  // 샘플 데이터
  const member: TeamMember = {
    id: 1,
    name: "김민수",
    userTag: "Email",
    image: "https://example.com/profile1.jpg",
    recentLocation: "제주도",
    travelPeriod: "2023.10.01 - 2023.10.07",
    travelPhoto: "https://example.com/jeju.jpg",
    travelTags: ["바다", "휴식", "맛집"],
    bio: "여행은 마음의 양식이다!",
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[360px] bg-white rounded-2xl p-6 flex flex-col">
        {/* 1. 프로필 사진 */}
        <div className="self-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {member.image ? (
              <img src={member.image} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400">{member.name.charAt(0)}</span>
            )}
          </div>
        </div>

        {/* 2. 사용자 이름 */}
        <h3 className="text-lg font-semibold text-gray-900 text-center">{member.name}</h3>

        {/* 3. 사용자 태그 */}
        <p className="text-sm text-gray-500 text-center mb-4">{member.userTag}</p>

        {/* 4. 최근 방문한 지역, 여행 기간, 여행 사진 */}
        <div className="bg-gray-100 rounded-lg p-4 mb-4">
          {member.travelPhoto && (
            <img
              src={member.travelPhoto}
              alt="Travel"
              className="w-full h-32 rounded-lg object-cover"
            />
          )}
          <div className="space-y-2 mb-4">
            <p className="text-sm text-gray-700">
              <span className="font-medium">최근 방문: </span>
              {member.recentLocation}
            </p>
            <p className="text-sm text-gray-700">
              <span className="font-medium">여행 기간: </span>
              {member.travelPeriod}
            </p>
          </div>
        </div>

        {/* 5. 여행 태그 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {member.travelTags.map((tag, index) => (
            <span key={index} className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-full">
              #{tag}
            </span>
          ))}
        </div>

        {/* 6. 사용자 한마디 */}
        <p className="text-sm text-gray-700 italic text-center">"{member.bio}"</p>
      </div>
    </div>
  );
};

export default TeamMemberModal;
