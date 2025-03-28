import React, { useState } from "react";

interface Participant {
  id: number;
  name: string;
  image?: string; // 프로필 사진 (선택적)
}

interface SimpleVoteData {
  id: number;
  title: string;
  content: string;
  participantsCount: number; // 참여 인원 수
  participants: Participant[]; // 참여자 목록
}

const SimpleVote: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [voteData, setVoteData] = useState<SimpleVoteData>({
    id: 1,
    title: "여행지",
    content: "여행 가서 할것들",
    participantsCount: 5,
    participants: [
      { id: 1, name: "김민수", image: "https://example.com/profile1.jpg" },
      { id: 2, name: "이영희" },
      { id: 3, name: "박지훈", image: "https://example.com/profile3.jpg" },
      { id: 4, name: "최수진" },
      { id: 5, name: "정현우", image: "https://example.com/profile5.jpg" },
    ],
  });
  const [hasVoted, setHasVoted] = useState(false); // 투표 여부 상태

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleVote = () => {
    if (!hasVoted) {
      const newParticipant = {
        id: voteData.participantsCount + 1,
        name: "새로운 참여자", // 백엔드 연결 시 실제 사용자 이름으로 대체
        image: undefined, // 백엔드에서 사진 제공 시 추가
      };
      setVoteData({
        ...voteData,
        participantsCount: voteData.participantsCount + 1,
        participants: [...voteData.participants, newParticipant],
      });
      setHasVoted(true);
      console.log("참여 완료");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[340px] h-[640px] bg-white rounded-2xl p-6 flex flex-col">
        {/* 투표 제목 */}
        <h3 className="text-xl font-bold text-gray-900 text-center mb-3">
          {voteData.title}
        </h3>

        {/* 투표 내용 */}
        <p className="text-3xl text-gray-700 text-center mb-6">
          {voteData.content}
        </p>

        {/* 참여자 프로필 사진 */}
        <div className="flex-1 overflow-y-auto mb-6">
          <div className="flex flex-wrap gap-2 items-center">
            {voteData.participants.map((participant) => (
              <div
                key={participant.id}
                className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden"
                title={participant.name} // 툴팁으로 이름 표시
              >
                {participant.image ? (
                  <img
                    src={participant.image}
                    alt={participant.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-lg text-gray-400">
                    {participant.name.charAt(0)}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 투표 결과 또는 버튼 */}
        {hasVoted ? (
          <div className="mt-auto text-center">
            <span className="text-sm font-medium text-gray-700">참여 인원</span>
            <p className="text-2xl font-bold text-blue-500 mt-2">
              {voteData.participantsCount}명
            </p>
          </div>
        ) : (
          <div className="mt-auto flex justify-center">
            <button
              className="w-2xl py-3 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
              onClick={handleVote}
            >
              참여
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SimpleVote;