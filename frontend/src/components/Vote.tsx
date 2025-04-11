// /frontend/src/components/Vote.tsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { createTravelVote, participateInTravelVote } from "../services/voteService";

interface VoteModalProps {
  groupUuid: string;
  onClose: () => void;
  onVoteCreated: () => void;
}

interface VoteItemProps {
  vote: TravelVote;
  currentUserUuid: string;
  onVoteUpdated: () => void;
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

export const VoteModal: React.FC<VoteModalProps> = ({ groupUuid, onClose, onVoteCreated }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [formData, setFormData] = useState({
    location: "",
    startDate: "",
    endDate: "",
    headcount: "",
    description: "",
    voteDeadline: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      await createTravelVote(groupUuid, {
        ...formData,
        headcount: formData.headcount ? parseInt(formData.headcount) : undefined,
      });
      onVoteCreated();
      handleClose();
    } catch (err) {
      setError("투표 생성에 실패했습니다.");
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">여행 투표 생성</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            <input
              type="text"
              name="location"
              placeholder="여행지"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <input
              type="number"
              name="headcount"
              placeholder="인원 수"
              value={formData.headcount}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <input
              type="datetime-local"
              name="voteDeadline"
              value={formData.voteDeadline}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            <textarea
              name="description"
              placeholder="설명"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
            {error && <p className="text-red-500">{error}</p>}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleClose}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400"
            >
              <span className="text-gray-800 text-sm">취소</span>
            </button>
            <button
              onClick={handleSubmit}
              className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600"
            >
              <span className="text-white text-sm">생성</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const VoteItem: React.FC<VoteItemProps> = ({ vote, currentUserUuid, onVoteUpdated }) => {
  const handleParticipate = async () => {
    try {
      await participateInTravelVote(vote.uuid, !vote.has_participated);
      onVoteUpdated();
    } catch (error) {
      console.error("투표 참여/취소 실패:", error);
    }
  };

  return (
    <div className="p-4 mb-4 border rounded-lg shadow-sm">
      <h3 className="text-lg font-semibold">{vote.location}</h3>
      <p>
        기간: {vote.start_date} ~ {vote.end_date}
      </p>
      {vote.headcount && <p>인원: {vote.headcount}명</p>}
      <p>마감: {vote.vote_deadline}</p>
      {vote.description && <p>{vote.description}</p>}
      <p>참여자: {vote.participant_count}명</p>
      <button
        onClick={handleParticipate}
        className={`mt-2 px-4 py-2 rounded ${
          vote.has_participated ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        } text-white`}
      >
        {vote.has_participated ? "참여 취소" : "참여"}
      </button>
    </div>
  );
};
