import React, { useState } from "react";

interface VoteOption {
  id: number;
  text: string;
  votes: number; // 투표 수
}

interface MultiVoteData {
  id: number;
  title: string;
  options: VoteOption[];
}

const MultiVote: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [voteData, setVoteData] = useState<MultiVoteData>({
    id: 1,
    title: "다음 여행지 추천",
    options: [
      { id: 1, text: "제주도", votes: 3 },
      { id: 2, text: "부산", votes: 5 },
      { id: 3, text: "강원도", votes: 2 },
    ],
  });
  const [hasVoted, setHasVoted] = useState(false); // 투표 여부 상태

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  const handleVote = (optionId: number) => {
    if (!hasVoted) {
      const updatedOptions = voteData.options.map((option) =>
        option.id === optionId ? { ...option, votes: option.votes + 1 } : option
      );
      setVoteData({ ...voteData, options: updatedOptions });
      setHasVoted(true);
      console.log(`투표: ${voteData.options.find((opt) => opt.id === optionId)?.text}`);
    }
  };

  const totalVotes = voteData.options.reduce((sum, opt) => sum + opt.votes, 0);
  const getPercentage = (votes: number) => (totalVotes > 0 ? (votes / totalVotes) * 100 : 0);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[360px] h-flex-fill bg-white rounded-2xl p-6 flex flex-col">
        {/* 투표 제목 */}
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">
          {voteData.title}
        </h3>

        {/* 투표 옵션 목록 */}
        <div className="space-y-4 flex-1 overflow-y-auto">
          {voteData.options.map((option) => (
            <div key={option.id} className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">{option.text}</span>
                {!hasVoted ? (
                  <button
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    onClick={() => handleVote(option.id)}
                  >
                    선택
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">{option.votes}표</span>
                )}
              </div>
              {hasVoted && (
                <div className="w-full h-2 bg-gray-200 rounded-full">
                  <div
                    className="h-full bg-blue-500 rounded-full"
                    style={{ width: `${getPercentage(option.votes)}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiVote;