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
      {/* Background Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      ></div>

      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">여행 투표 생성</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            <Icons name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">여행지</label>
            <input
              type="text"
              name="location"
              placeholder="예: 서울"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">여행 시작일</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">여행 종료일</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">인원 수 (선택)</label>
            <input
              type="number"
              name="headcount"
              placeholder="예: 5"
              value={formData.headcount}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">투표 마감 시간</label>
            <input
              type="datetime-local"
              name="voteDeadline"
              value={formData.voteDeadline}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              name="description"
              placeholder="여행 계획에 대한 간단한 설명"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none h-24"
            />
          </div>

          {error && <p className="text-red-600 text-sm font-medium">{error}</p>}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClose}
              className="h-11 w-full bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="h-11 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium"
            >
              투표 생성
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const VoteItem: React.FC<VoteItemProps> = ({ vote, onVoteUpdated }) => {
  const handleParticipate = async () => {
    try {
      await participateInTravelVote(vote.uuid, !vote.has_participated);
      onVoteUpdated();
    } catch (error) {
      console.error("투표 참여/취소 실패:", error);
    }
  };

  return (
    <div className="p-5 mb-4 border border-gray-200 rounded-xl shadow-md bg-white hover:shadow-lg transition-shadow duration-200">
      <h3 className="text-xl font-semibold text-gray-800">{vote.location}</h3>
      <div className="mt-2 space-y-2 text-gray-600">
        <p>
          <span className="font-medium text-blue-600">여행 기간:</span> {vote.start_date} ~{" "}
          {vote.end_date}
        </p>
        {vote.headcount && (
          <p>
            <span className="font-medium text-blue-600">인원:</span> {vote.headcount}명
          </p>
        )}
        <p>
          <span className="font-medium text-red-600">투표 마감:</span> {vote.vote_deadline}
        </p>
        {vote.description && <p className="text-gray-500 italic">{vote.description}</p>}
        <p>
          <span className="font-medium">참여자:</span> {vote.participant_count}명
        </p>
      </div>
      <button
        onClick={handleParticipate}
        className={`mt-4 px-5 py-2 rounded-lg font-medium text-white transition-colors duration-200 ${
          vote.has_participated ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
        }`}
      >
        {vote.has_participated ? "참여 취소" : "참여하기"}
      </button>
    </div>
  );
};
