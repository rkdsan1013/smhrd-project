// /frontend/src/components/VoteList.tsx

import React, { useState, useEffect } from "react";
import { VoteModal, VoteItem } from "./Vote";
import { getTravelVotes } from "../services/voteService";

interface VoteListProps {
  groupUuid: string;
  currentUserUuid: string;
}

interface TravelVote {
  uuid: string;
  location: string;
  start_date: string;
  end_date: string;
  headcount?: number;
  description?: string;
  vote_deadline: string;
  is_confirmed: boolean;
  participant_count: number;
  has_participated: boolean;
}

const VoteList: React.FC<VoteListProps> = ({ groupUuid, currentUserUuid }) => {
  const [votes, setVotes] = useState<TravelVote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchVotes = async () => {
    try {
      const data = await getTravelVotes(groupUuid);
      console.log("Fetched votes:", data); // 반환 데이터 로그
      if (Array.isArray(data)) {
        setVotes(data);
      } else {
        console.error("Expected an array, got:", data);
        setVotes([]); // 배열이 아니면 빈 배열로 설정
      }
    } catch (error) {
      console.error("투표 목록 조회 실패:", error);
      setVotes([]); // 에러 발생 시 빈 배열 유지
    }
  };

  useEffect(() => {
    fetchVotes();
  }, [groupUuid]);

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">여행 일정</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          일정 생성
        </button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {votes.length === 0 ? (
          <p>투표가 없습니다.</p>
        ) : (
          votes.map((vote) => (
            <VoteItem
              key={vote.uuid}
              vote={vote}
              currentUserUuid={currentUserUuid}
              onVoteUpdated={fetchVotes}
            />
          ))
        )}
      </div>
      {isModalOpen && (
        <VoteModal
          groupUuid={groupUuid}
          onClose={() => setIsModalOpen(false)}
          onVoteCreated={fetchVotes}
        />
      )}
    </div>
  );
};

export default VoteList;
