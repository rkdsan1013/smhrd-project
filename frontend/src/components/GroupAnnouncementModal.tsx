// /frontend/src/components/GroupAnnouncementModal.tsx

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { createAnnouncement } from "../services/groupService";

interface GroupAnnouncementModalProps {
  groupUuid: string;
  onClose: () => void;
  onCreated?: () => void;
}

const GroupAnnouncementModal: React.FC<GroupAnnouncementModalProps> = ({
  groupUuid,
  onClose,
  onCreated,
}) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(), 300);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      await createAnnouncement(groupUuid, title, content);
      handleClose();
      if (onCreated) onCreated();
    } catch (err: any) {
      setError("공지사항 등록에 실패했습니다.");
      console.error("[GroupAnnouncementModal] 생성 실패:", err.message);
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>
      <div
        className={`relative bg-white rounded-xl shadow-xl w-96 p-6 transform transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">공지사항 작성</h2>
          <button onClick={handleClose} className="p-2 rounded hover:bg-gray-200">
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="mb-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="공지 제목"
            className="w-full p-3 mb-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
            maxLength={100}
          />
        </div>
        <div className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="공지 내용"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none h-28"
          ></textarea>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`px-6 py-2 bg-green-600 text-white rounded-md transition-all duration-200 ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "hover:bg-green-700"
            }`}
          >
            등록
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GroupAnnouncementModal;
