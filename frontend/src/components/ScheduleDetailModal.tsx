// /frontend/src/components/ScheduleDetailModal.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";

interface DefaultValues {
  detailDate: string;
  startTime: string;
  endTime: string;
}

interface ScheduleDetailModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    location: string;
    detailDate: string;
    startTime: string;
    endTime: string;
  }) => void;
  defaultValues?: DefaultValues;
}

const ScheduleDetailModal: React.FC<ScheduleDetailModalProps> = ({
  onClose,
  onSubmit,
  defaultValues,
}) => {
  const [isVisible, setIsVisible] = useState(false);

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

  const handleSubmit = () => {
    onSubmit(formData);
    handleModalClose();
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
          <h2 className="text-xl font-bold">상세 일정 추가</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="일정 제목"
            className="w-full border px-3 py-2 rounded-md"
          />
          <input
            type="date"
            name="detailDate"
            value={formData.detailDate}
            onChange={handleChange}
            className="w-full border px-3 py-2 rounded-md"
          />
          <div className="flex gap-2">
            <input
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-1/2 border px-3 py-2 rounded-md"
            />
            <input
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-1/2 border px-3 py-2 rounded-md"
            />
          </div>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="장소"
            className="w-full border px-3 py-2 rounded-md"
          />
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="설명"
            className="w-full border px-3 py-2 rounded-md"
          ></textarea>
        </div>

        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleModalClose}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
            >
              <span className="text-gray-800 text-sm">취소</span>
            </button>
            <button
              onClick={handleSubmit}
              className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              <span className="text-white text-sm">추가</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ScheduleDetailModal;
