// /frontend/src/components/VoteList.tsx

import React, { useState, useEffect } from "react";
import { VoteModal, VoteItem } from "./Vote";
import { getTravelVotes } from "../services/voteService";
import { useSocket } from "../contexts/SocketContext";

interface VoteListProps {
  groupUuid: string;
  currentUserUuid: string;
  onVoteSelected?: (scheduleUuid: string) => void;
}

export interface TravelVote {
  uuid: string;
  title: string;
  location: string;
  start_date: string;
  end_date: string;
  headcount?: number;
  description?: string;
  is_confirmed: boolean;
  participant_count: number;
  has_participated: boolean;
  schedule_uuid?: string;
  group_uuid: string;
}

const VoteList: React.FC<VoteListProps> = ({ groupUuid, currentUserUuid, onVoteSelected }) => {
  const [votes, setVotes] = useState<TravelVote[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { socket } = useSocket();

  const fetchVotes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTravelVotes(groupUuid);
      console.log(`[VoteList] 일정 목록 조회 성공 (group ${groupUuid}):`, response);

      if (Array.isArray(response.votes)) {
        const mappedVotes = response.votes.map((vote: any) => ({
          ...vote,
          title: vote.title || "제목 없음",
        }));
        setVotes(mappedVotes);
        console.log(`[VoteList] 일정 목록 설정: ${mappedVotes.length}개`);
      } else {
        throw new Error("일정 데이터 형식이 잘못되었습니다. 예상: { votes: 배열 }");
      }
    } catch (error: any) {
      const errMsg = error.message || `일정 목록을 불러오는 데 실패했습니다.`;
      setError(errMsg);
      setVotes([]);
      console.error(`[VoteList] 일정 목록 조회 실패 (group ${groupUuid}):`, {
        message: error.message,
        data: error.data,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVotes();

    if (socket) {
      socket.emit("joinRoom", groupUuid);

      socket.on(
        "travelVoteCreated",
        ({ voteUuid, groupUuid: eventGroupUuid }: { voteUuid: string; groupUuid: string }) => {
          if (eventGroupUuid === groupUuid) {
            fetchVotes();
            console.log(`[VoteList] 새 일정 생성 수신: ${voteUuid}`);
          }
        },
      );

      socket.on(
        "voteParticipationUpdated",
        ({
          voteUuid,
          participant_count,
          userUuid,
          participate,
        }: {
          voteUuid: string;
          participant_count: number;
          userUuid: string;
          participate: boolean;
        }) => {
          setVotes((prev) =>
            prev.map((vote) =>
              vote.uuid === voteUuid
                ? {
                    ...vote,
                    participant_count,
                    has_participated:
                      userUuid === currentUserUuid ? participate : vote.has_participated,
                  }
                : vote,
            ),
          );
          console.log(`[VoteList] 일정 참여 업데이트: ${voteUuid}, count: ${participant_count}`);
        },
      );

      socket.on(
        "travelVoteDeleted",
        ({ voteUuid, groupUuid: eventGroupUuid }: { voteUuid: string; groupUuid: string }) => {
          if (eventGroupUuid === groupUuid) {
            setVotes((prev) => prev.filter((vote) => vote.uuid !== voteUuid));
            console.log(`[VoteList] 일정 삭제 수신: ${voteUuid}`);
          }
        },
      );

      return () => {
        socket.off("travelVoteCreated");
        socket.off("voteParticipationUpdated");
        socket.off("travelVoteDeleted");
      };
    }
  }, [groupUuid, socket, currentUserUuid]);

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
        {loading && <p className="text-center text-gray-500">일정 목록을 불러오는 중...</p>}
        {error && <p className="text-center text-red-500">{error}</p>}
        {!loading && !error && votes.length === 0 && (
          <p className="text-center text-gray-500">일정이 없습니다.</p>
        )}
        {!loading &&
          !error &&
          votes.map((vote) => (
            <VoteItem
              key={vote.uuid}
              vote={vote}
              currentUserUuid={currentUserUuid}
              onVoteUpdated={fetchVotes}
              onClick={() => vote.schedule_uuid && onVoteSelected?.(vote.schedule_uuid)}
            />
          ))}
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
