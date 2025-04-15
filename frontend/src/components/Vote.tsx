// /frontend/src/components/Vote.tsx

import React, { useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { createTravelVote, toggleVoteParticipation } from "../services/voteService";

interface VoteModalProps {
  groupUuid: string;
  onClose: () => void;
  onVoteCreated: () => void;
}

interface VoteItemProps {
  vote: {
    uuid: string;
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
  };
  currentUserUuid: string;
  onVoteUpdated: () => void;
  onClick?: () => void;
}

export const VoteModal: React.FC<VoteModalProps> = ({ groupUuid, onClose, onVoteCreated }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    startDate: "",
    endDate: "",
    headcount: "",
    description: "",
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof typeof formData, string>> & { general?: string }
  >({});

  const validateForm = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> & { general?: string } = {};

    if (!formData.title) newErrors.title = "일정 제목을 입력하세요.";
    if (!formData.location) newErrors.location = "여행지를 입력하세요.";
    if (!formData.startDate) newErrors.startDate = "여행 시작일을 선택하세요.";
    if (!formData.endDate) newErrors.endDate = "여행 종료일을 선택하세요.";

    // 현재 시각 대신 오늘의 자정(00:00) 기준을 생성
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const start = formData.startDate ? new Date(formData.startDate) : null;
    const end = formData.endDate ? new Date(formData.endDate) : null;

    // start와 end를 today(자정)와 비교하여 오늘 이전이면 과거로 판단
    if (start && start < today) newErrors.startDate = "시작일은 과거일 수 없습니다.";
    if (end && end < today) newErrors.endDate = "종료일은 과거일 수 없습니다.";
    if (start && end && start > end) newErrors.endDate = "종료일은 시작일보다 늦어야 합니다.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: undefined });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await createTravelVote(groupUuid, {
        ...formData,
        headcount: formData.headcount ? parseInt(formData.headcount) : undefined,
      });
      onVoteCreated();
      handleClose();
    } catch (err: any) {
      const errorMessage = err.message.includes("SQL syntax")
        ? "일정 생성 중 서버 오류가 발생했습니다. 입력을 확인해주세요."
        : err.message || "일정 생성에 실패했습니다.";
      setErrors({ general: errorMessage });
      console.error(`[VoteModal] 일정 생성 실패 (group ${groupUuid}):`, err);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-9999">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleClose}
      ></div>
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">여행 일정 생성</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200"
          >
            <Icons name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">일정 제목</label>
            <input
              type="text"
              name="title"
              placeholder="예: 부산 여행"
              value={formData.title}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 ${
                errors.title ? "border-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.title && <p className="text-red-600 text-sm mt-1">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">여행지</label>
            <input
              type="text"
              name="location"
              placeholder="예: 부산"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 ${
                errors.location ? "border-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">여행 시작일</label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 ${
                  errors.startDate ? "border-red-500" : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.startDate && <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">여행 종료일</label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 ${
                  errors.endDate ? "border-red-500" : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              {errors.endDate && <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택)</label>
            <textarea
              name="description"
              placeholder="여행 계획에 대한 간단한 설명"
              value={formData.description}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 h-24"
            />
          </div>
          {errors.general && <p className="text-red-600 text-sm font-medium">{errors.general}</p>}
        </div>
        <div className="p-5 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleClose}
              className="h-11 w-full bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              className="h-11 w-full bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              일정 생성
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export const VoteItem: React.FC<VoteItemProps> = ({
  vote,
  currentUserUuid,
  onVoteUpdated,
  onClick,
}) => {
  const [error, setError] = useState<string | null>(null);

  const handleParticipate = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      console.log(
        `[VoteItem] User ${currentUserUuid} toggling participation for vote ${
          vote.uuid
        }, participate: ${!vote.has_participated}`,
      );
      await toggleVoteParticipation(vote.uuid, !vote.has_participated);
      onVoteUpdated();
    } catch (error: any) {
      const errMsg = error.message || "참여/취소 처리에 실패했습니다.";
      setError(errMsg);
      console.error(`[VoteItem] 참여/취소 실패 (vote ${vote.uuid}): ${error.message}`, error.data);
    }
  };

  const handleEnterChat = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (vote.has_participated && vote.schedule_uuid && onClick) {
      onClick(); // 채팅방 입장은 상위 컴포넌트(VoteList)에서 처리
    }
  };

  return (
    <div className="p-5 mb-4 border border-gray-200 rounded-xl shadow-md bg-white hover:shadow-lg">
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
        {vote.description && <p className="text-gray-500 italic">{vote.description}</p>}
        <p>
          <span className="font-medium">참여자:</span> {vote.participant_count}명
        </p>
      </div>

      <div className="flex gap-3 mt-4">
        <button
          onClick={handleParticipate}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
            vote.has_participated
              ? "bg-red-500 hover:bg-red-600"
              : "bg-green-500 hover:bg-green-600"
          }`}
        >
          {vote.has_participated ? "참여 취소" : "참여하기"}
        </button>

        <button
          onClick={handleEnterChat}
          disabled={!vote.has_participated}
          className={`flex-1 px-4 py-2 rounded-lg font-medium text-white ${
            vote.has_participated
              ? "bg-blue-500 hover:bg-blue-600"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          채팅방 입장
        </button>
      </div>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
    </div>
  );
};
