// /frontend/src/components/MultiVote.tsx
import React, { useState, useEffect } from "react";
import { fetchVote, voteMulti } from "../services/voteService";

interface MultiVoteProps {
  voteUuid: string; // prop 타입 정의
}

const MultiVote: React.FC<MultiVoteProps> = ({ voteUuid }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [voteData, setVoteData] = useState<any>(null);
  const [hasVoted, setHasVoted] = useState(false);

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

  const handleVote = async (optionUuid: string) => {
    if (!hasVoted) {
      try {
        await voteMulti(voteUuid, { optionUuid });
        const updatedOptions = voteData.options.map((opt: any) =>
          opt.uuid === optionUuid ? { ...opt, votes: opt.votes + 1 } : opt,
        );
        setVoteData({ ...voteData, options: updatedOptions });
        setHasVoted(true);
        console.log(`투표: ${voteData.options.find((opt: any) => opt.uuid === optionUuid)?.text}`);
      } catch (err) {
        console.error("투표 실패:", err);
      }
    }
  };

  if (!isOpen || !voteData) return null;

  const totalVotes = voteData.options.reduce((sum: number, opt: any) => sum + opt.votes, 0);
  const getPercentage = (votes: number) => (totalVotes > 0 ? (votes / totalVotes) * 100 : 0);

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[360px] h-flex-fill bg-white rounded-2xl p-6 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 text-center mb-6">{voteData.title}</h3>
        <div className="space-y-4 flex-1 overflow-y-auto">
          {voteData.options.map((option: any) => (
            <div key={option.uuid} className="flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">{option.text}</span>
                {!hasVoted ? (
                  <button
                    className="px-4 py-1 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                    onClick={() => handleVote(option.uuid)}
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
