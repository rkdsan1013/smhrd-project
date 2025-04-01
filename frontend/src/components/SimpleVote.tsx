// /frontend/src/components/SimpleVote.tsx
import React, { useState, useEffect } from "react";
import { fetchVote, participateSimple } from "../services/voteService";

interface SimpleVoteProps {
  voteUuid: string; // prop 타입 정의
}

const SimpleVote: React.FC<SimpleVoteProps> = ({ voteUuid }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [voteData, setVoteData] = useState<any>(null);
  const [hasParticipated, setHasParticipated] = useState(false);

  useEffect(() => {
    const loadVote = async () => {
      try {
        const response = await fetchVote(voteUuid);
        setVoteData(response.vote);
      } catch (err) {
        console.error("투표 조회 실패:", err);
      }
    };
    loadVote();
  }, [voteUuid]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleParticipate = async () => {
    if (!hasParticipated) {
      try {
        await participateSimple(voteUuid);
        setVoteData({
          ...voteData,
          participantsCount: (voteData.participantsCount || 0) + 1,
        });
        setHasParticipated(true);
        console.log("참여 성공");
      } catch (err) {
        console.error("참여 실패:", err);
      }
    }
  };

  if (!isOpen || !voteData) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[360px] bg-white rounded-2xl p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">{voteData.title}</h3>
        <div className="flex flex-col items-center gap-4">
          {!hasParticipated ? (
            <button
              onClick={handleParticipate}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              참여하기
            </button>
          ) : (
            <p className="text-sm text-gray-700">참여자 수: {voteData.participantsCount}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleVote;
