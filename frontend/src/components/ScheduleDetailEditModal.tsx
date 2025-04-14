import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import moment from "moment";
import Icons from "./Icons";
import scheduleService from "../services/scheduleService";

interface DefaultValues {
  uuid: string;
  detailDate: string;
  startTime: string;
  endTime: string;
  location: string;
  description: string;
}

interface ScheduleDetailEditModalProps {
  onClose: () => void;
  defaultValues: DefaultValues;
}

const ScheduleDetailEditModal: React.FC<ScheduleDetailEditModalProps> = ({
  onClose,
  defaultValues,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [formData, setFormData] = useState({
    detailDate: defaultValues.detailDate || "",
    startTime: defaultValues.startTime || "",
    endTime: defaultValues.endTime || "",
    location: defaultValues.location || "",
    description: defaultValues.description || "",
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

  const validateForm = () => {
    const newErrors: Partial<Record<keyof typeof formData, string>> = {};

    if (!formData.detailDate) newErrors.detailDate = "날짜를 선택하세요.";
    if (!formData.startTime) newErrors.startTime = "시작 시간을 선택하세요.";
    if (!formData.endTime) newErrors.endTime = "종료 시간을 선택하세요.";
    if (!formData.location) newErrors.location = "장소를 입력하세요.";

    if (formData.detailDate && formData.startTime && formData.endTime) {
      const startDateTime = new Date(`${formData.detailDate}T${formData.startTime}`);
      const endDateTime = new Date(`${formData.detailDate}T${formData.endTime}`);
      if (startDateTime > endDateTime) {
        newErrors.endTime = "종료 시간은 시작 시간보다 늦어야 합니다.";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const start_time = moment(`${formData.detailDate}T${formData.startTime}`).format(
        "YYYY-MM-DD HH:mm:ss",
      );
      const end_time = moment(`${formData.detailDate}T${formData.endTime}`).format(
        "YYYY-MM-DD HH:mm:ss",
      );

      const scheduleData = {
        location: formData.location,
        description: formData.description,
        start_time,
        end_time,
        // type는 그대로 'personal'
        type: "personal" as "personal",
      };

      await scheduleService.updateSchedule(defaultValues.uuid, scheduleData);
      handleModalClose();
    } catch (error) {
      console.error("일정 수정에 실패했습니다.", error);
      alert("일정 수정에 실패했습니다.");
      setIsSubmitting(false);
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>
      <div
        className={`relative bg-white rounded-xl shadow-2xl w-96 transform transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <div className="flex justify-between items-center p-5 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">상세 일정 수정</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors duration-200"
          >
            <Icons name="close" className="w-6 h-6 text-gray-500" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
            <input
              type="date"
              name="detailDate"
              value={formData.detailDate}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            {errors.detailDate && <p className="mt-1 text-sm text-red-500">{errors.detailDate}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
              <input
                type="time"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
              />
              {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
            />
            {errors.location && <p className="mt-1 text-sm text-red-500">{errors.location}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="설명"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 resize-none h-24"
            ></textarea>
          </div>
        </div>
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
              수정
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ScheduleDetailEditModal;
