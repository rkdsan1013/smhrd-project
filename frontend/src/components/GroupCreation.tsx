// /frontend/src/components/GroupCreation.tsx

import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import ReactDOM from "react-dom";
import { validateName, validateDescription } from "../utils/validators";
import Icons from "./Icons";
import { createGroup, GroupInfo } from "../services/groupService";

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface GroupCreationProps {
  onClose: () => void;
  onCreate?: (newGroup: GroupInfo) => void;
}

// 설문 선택지 정의
const surveyOptions = {
  activity: ["맛집탐방", "액티비티", "휴양", "문화/역사 체험"],
  budget: ["가성비", "럭셔리"],
  duration: ["당일치기", "7일 미만", "7일 이상"],
};

const GroupCreation: React.FC<GroupCreationProps> = ({ onClose, onCreate }) => {
  const [step, setStep] = useState<"creation" | "settings">("creation");
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [formError, setFormError] = useState("");

  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupIcon, setGroupIcon] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string | null>(null);
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const [groupPicturePreview, setGroupPicturePreview] = useState<string | null>(null);
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("private");

  // 설문 상태 (선택 안 하면 ""로 유지)
  const [surveyAnswers, setSurveyAnswers] = useState({
    activity: "",
    budget: "",
    duration: "",
  });

  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  const adjustHeight = () => {
    if (outerRef.current && innerRef.current) {
      const newHeight = innerRef.current.offsetHeight;
      let currentHeight = parseFloat(getComputedStyle(outerRef.current).height || "0");
      if (oldHeightRef.current != null) {
        currentHeight = oldHeightRef.current;
        oldHeightRef.current = null;
      }
      if (Math.round(currentHeight) !== Math.round(newHeight)) {
        outerRef.current.style.transition = "none";
        outerRef.current.style.height = `${currentHeight}px`;
        outerRef.current.getBoundingClientRect();
        outerRef.current.style.transition = "height 0.3s ease-in-out";
        outerRef.current.style.height = `${newHeight}px`;
      }
    }
  };

  useLayoutEffect(() => {
    adjustHeight();
  }, [
    groupName,
    groupDescription,
    groupIconPreview,
    groupPicturePreview,
    groupVisibility,
    hasMounted,
    step,
    formError,
    surveyAnswers,
  ]);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormError("");
      setFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const onGroupIconChange = (e: ChangeEvent<HTMLInputElement>) =>
    handleFileChange(e, setGroupIcon, setGroupIconPreview);

  const onGroupPictureChangeSettings = (e: ChangeEvent<HTMLInputElement>) =>
    handleFileChange(e, setGroupPicture, setGroupPicturePreview);

  const handleSurveyChange = (key: keyof typeof surveyAnswers, value: string) => {
    setSurveyAnswers((prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }));
    setFormError("");
  };

  const goToSettings = () => {
    const nameValidation = validateName(groupName);
    if (!nameValidation.valid) {
      setFormError(nameValidation.message ?? "유효하지 않은 입력입니다.");
      return;
    }
    const descValidation = validateDescription(groupDescription);
    if (!descValidation.valid) {
      setFormError(descValidation.message ?? "유효하지 않은 입력입니다.");
      return;
    }
    setFormError("");
    captureHeight();
    setStep("settings");
  };

  const goToCreation = () => {
    captureHeight();
    setStep("creation");
  };

  const onSubmitGroup = async () => {
    const nameValidation = validateName(groupName);
    if (!nameValidation.valid) {
      setFormError(nameValidation.message ?? "유효하지 않은 입력입니다.");
      return;
    }
    const descValidation = validateDescription(groupDescription);
    if (!descValidation.valid) {
      setFormError(descValidation.message ?? "유효하지 않은 입력입니다.");
      return;
    }

    try {
      const payload = {
        name: groupName.trim(),
        description: groupDescription.trim(),
        groupIcon,
        groupPicture,
        visibility: groupVisibility,
        survey: {
          activity_type: surveyAnswers.activity
            ? surveyOptions.activity.indexOf(surveyAnswers.activity) + 1
            : 0,
          budget_type: surveyAnswers.budget
            ? surveyOptions.budget.indexOf(surveyAnswers.budget) + 1
            : 0,
          trip_duration: surveyAnswers.duration
            ? surveyOptions.duration.indexOf(surveyAnswers.duration) + 1
            : 0,
        },
      };
      const createdGroup = await createGroup(payload);
      alert("그룹이 생성되었습니다. 그룹 ID: " + createdGroup.uuid);
      if (onCreate) {
        onCreate(createdGroup);
      }
      onCloseModal();
    } catch (error: any) {
      setFormError(error.message || "그룹 생성 중 오류가 발생했습니다.");
    }
  };

  const onCloseModal = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const captureHeight = () => {
    if (outerRef.current) {
      oldHeightRef.current = outerRef.current.offsetHeight;
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-9999">
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 select-none transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          position: "absolute",
        }}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">{step === "creation" ? "그룹 생성" : "그룹 설정"}</h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 space-y-6">
            {step === "creation" ? (
              <div className="flex flex-col items-center space-y-4">
                <div className="flex flex-col items-center">
                  <label
                    htmlFor="groupIcon"
                    className="relative group w-24 h-24 mb-2 rounded-full overflow-hidden"
                  >
                    <div className="w-full h-full">
                      {groupIconPreview ? (
                        <img
                          src={groupIconPreview}
                          alt="그룹 아이콘 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <Icons name="image" className="w-8 h-8 text-white" />
                    </div>
                  </label>
                  <input
                    type="file"
                    id="groupIcon"
                    accept="image/*"
                    onChange={onGroupIconChange}
                    className="hidden"
                  />
                </div>
                <div className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      id="groupName"
                      value={groupName}
                      onChange={(e) => {
                        setGroupName(e.target.value);
                        setFormError("");
                      }}
                      className={baseInputClass}
                      placeholder=" "
                    />
                    <label htmlFor="groupName" className={labelClass}>
                      그룹 이름
                    </label>
                  </div>
                </div>
                <div className="w-full relative">
                  <textarea
                    id="groupDescription"
                    value={groupDescription}
                    onChange={(e) => {
                      setGroupDescription(e.target.value);
                      setFormError("");
                    }}
                    className={`${baseInputClass} resize-none`}
                    placeholder=" "
                    rows={5}
                  />
                  <div
                    className="absolute left-0 w-full pointer-events-none"
                    style={{
                      top: "-0.5rem",
                      height: "1.5rem",
                      zIndex: 20,
                      backgroundColor: "white",
                    }}
                  />
                  <label htmlFor="groupDescription" className={`${labelClass} z-30 bg-white`}>
                    그룹 설명
                  </label>
                </div>
                <div className="w-full text-left">
                  <span className="text-sm font-medium text-gray-700">공개 여부</span>
                  <div className="mt-2">
                    <label
                      htmlFor="toggleVisibility"
                      className="relative inline-flex items-center cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        id="toggleVisibility"
                        className="sr-only peer"
                        checked={groupVisibility === "public"}
                        onChange={(e) =>
                          setGroupVisibility(e.target.checked ? "public" : "private")
                        }
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                      <span className="ml-3 text-sm font-medium text-gray-900">
                        {groupVisibility === "public" ? "공개" : "비공개"}
                      </span>
                    </label>
                  </div>
                </div>
                {formError && <p className="w-full text-red-500 text-sm text-left">{formError}</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center flex-1 min-w-0 space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                      {groupIconPreview ? (
                        <img
                          src={groupIconPreview}
                          alt="그룹 아이콘 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold overflow-hidden whitespace-nowrap truncate">
                        {groupName}
                      </p>
                    </div>
                  </div>
                  <div
                    className="ml-4 flex-shrink-0 text-sm font-medium text-gray-900 overflow-hidden whitespace-nowrap truncate text-right"
                    style={{ maxWidth: "30%" }}
                  >
                    {groupVisibility === "public" ? "공개" : "비공개"}
                  </div>
                </div>
                <div>
                  <label
                    htmlFor="groupPicture"
                    className="relative group block w-full h-64 mb-4 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  >
                    <div className="w-full h-full">
                      {groupPicturePreview && (
                        <img
                          src={groupPicturePreview}
                          alt="그룹 배경 사진 미리보기"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                      <Icons name="image" className="w-8 h-8 text-white" />
                    </div>
                  </label>
                  <input
                    type="file"
                    id="groupPicture"
                    accept="image/*"
                    onChange={onGroupPictureChangeSettings}
                    className="hidden"
                  />
                </div>
                <div className="text-left">
                  <p className="text-base font-medium text-gray-800 mb-1">그룹 설명</p>
                  <div style={{ maxHeight: "15rem", overflowY: "auto" }}>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{groupDescription}</p>
                  </div>
                </div>
                {/* 멀티셀렉트 칩스 스타일 설문 UI */}
                <div className="w-full space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">선호하는 여행 활동</p>
                    <div className="flex flex-wrap gap-2">
                      {surveyOptions.activity.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSurveyChange("activity", opt)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                            surveyAnswers.activity === opt
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">선호하는 여행 예산</p>
                    <div className="flex flex-wrap gap-2">
                      {surveyOptions.budget.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSurveyChange("budget", opt)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                            surveyAnswers.budget === opt
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">선호하는 여행 기간</p>
                    <div className="flex flex-wrap gap-2">
                      {surveyOptions.duration.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSurveyChange("duration", opt)}
                          className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                            surveyAnswers.duration === opt
                              ? "bg-blue-500 text-white shadow-md"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {formError && <p className="w-full text-red-500 text-sm text-left">{formError}</p>}
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          {step === "creation" ? (
            <div className="grid grid-cols-2 gap-2">
              <div className="h-10 w-full" />
              <button
                onClick={goToSettings}
                className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">다음</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={goToCreation}
                className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
              >
                <span className="text-gray-800 text-sm">이전</span>
              </button>
              <button
                onClick={onSubmitGroup}
                className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">생성</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default GroupCreation;
