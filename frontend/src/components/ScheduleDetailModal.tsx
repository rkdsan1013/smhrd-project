// /frontend/src/components/ScheduleDetailModal.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import Icons from "./Icons";
import scheduleService from "../services/scheduleService";

interface DefaultValues {
  detailDate: string;
  startTime: string;
  endTime: string;
}

interface ScheduleDetailModalProps {
  onClose: () => void;
  defaultValues?: DefaultValues;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({ onClose, defaultValues }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    detailDate: defaultValues?.detailDate || "",
    startTime: defaultValues?.startTime || "",
    endTime: defaultValues?.endTime || "",
  });

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      // 날짜와 시간을 결합해 MySQL DATETIME 형식으로 변환
      const start_time = moment(`${formData.detailDate}T${formData.startTime}`).format(
        "YYYY-MM-DD HH:mm:ss",
      );
      const end_time = moment(`${formData.detailDate}T${formData.endTime}`).format(
        "YYYY-MM-DD HH:mm:ss",
      );

      const scheduleData = {
        title: formData.title,
        description: formData.description,
        location: formData.location,
        start_time,
        end_time,
        type: "personal" as "personal",
      };

      await scheduleService.createSchedule(scheduleData);
      handleModalClose();
    } catch (error) {
      console.error("일정 생성에 실패했습니다.", error);
      alert("일정 생성에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      {/* Background Overlay (클릭 이벤트 제거) */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Container */}
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-96 transform transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">상세 일정 추가</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            <Icons name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="일정 제목"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              name="detailDate"
              value={formData.detailDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">장소</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="장소"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="설명"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 resize-none h-24"
            ></textarea>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleModalClose}
              className="h-11 w-full bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-medium"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={`h-11 w-full rounded-lg transition-colors duration-200 font-medium ${
                isSubmitting
                  ? "bg-blue-400 text-white cursor-not-allowed"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              추가
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ScheduleDetailModal;
