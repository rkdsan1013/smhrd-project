// /frontend/src/components/GroupCreation.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import Icons from "./Icons";

interface GroupCreationProps {
  onClose: () => void;
}

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

const GroupCreation: React.FC<GroupCreationProps> = ({ onClose }) => {
  // 모달/레이아웃 관련 상태
  const [isVisible, setIsVisible] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 그룹 정보 상태 (SQL 테이블 기준)
  const [groupName, setGroupName] = useState(""); // group_info.name
  const [groupDescription, setGroupDescription] = useState(""); // group_info.description
  const [groupPicture, setGroupPicture] = useState<File | null>(null); // group_info.group_picture
  const [groupPicturePreview, setGroupPicturePreview] = useState<string | null>(null);
  // 그룹 공개 여부: 기본 상태를 "비공개"로 설정
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("private");
  const [formError, setFormError] = useState("");

  // 모달 fade-in 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 초기 높이 설정
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 내용 변경 시 높이 동적 조절
  useLayoutEffect(() => {
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
        outerRef.current.getBoundingClientRect(); // 강제 reflow
        outerRef.current.style.transition = "height 0.3s ease-in-out";
        outerRef.current.style.height = `${newHeight}px`;
      }
    }
  }, [groupName, groupDescription, groupPicturePreview, groupVisibility, hasMounted]);

  // 그룹 이미지 변경 핸들러
  const onGroupPictureChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (formError) setFormError("");
      setGroupPicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setGroupPicturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 그룹 생성 버튼 핸들러
  const onCreateGroup = async () => {
    if (!groupName.trim()) {
      setFormError("그룹 이름을 입력해 주세요.");
      return;
    }
    try {
      // API 호출 시 group_info 테이블에 맞게 (groupName, groupDescription, groupPicture, groupVisibility)를 사용
      alert("그룹이 생성되었습니다.");
      onCloseModal();
    } catch (error: any) {
      setFormError(error.message || "그룹 생성 중 오류가 발생했습니다.");
    }
  };

  // 모달 닫기 핸들러
  const onCloseModal = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* Overlay */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCloseModal}
      />
      {/* Modal */}
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
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">그룹 생성</h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 flex flex-col items-center">
            {/* 그룹 이미지 업로드 */}
            <div className="mb-6 flex flex-col items-center">
              <label
                htmlFor="groupPicture"
                className="relative group w-24 h-24 mb-2 rounded-full overflow-hidden"
              >
                <div className="w-full h-full">
                  {groupPicturePreview ? (
                    <img
                      src={groupPicturePreview}
                      alt="그룹 이미지 미리보기"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 rounded-full"></div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
              </label>
              <input
                type="file"
                id="groupPicture"
                accept="image/*"
                onChange={onGroupPictureChange}
                className="hidden"
              />
            </div>

            {/* 그룹 이름 입력 */}
            <div className="w-full text-center mb-4">
              <div className="relative mb-1">
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  onChange={(e) => {
                    setGroupName(e.target.value);
                    if (formError) setFormError("");
                  }}
                  className={baseInputClass}
                  placeholder=" "
                />
                <label htmlFor="groupName" className={labelClass}>
                  그룹 이름
                </label>
              </div>
            </div>

            {/* 그룹 설명 입력 */}
            <div className="w-full text-center mb-4">
              <div className="relative mb-1">
                <textarea
                  id="groupDescription"
                  value={groupDescription}
                  onChange={(e) => {
                    setGroupDescription(e.target.value);
                    if (formError) setFormError("");
                  }}
                  className={`${baseInputClass} resize-none`}
                  placeholder=" "
                  rows={3}
                />
                <label htmlFor="groupDescription" className={labelClass}>
                  그룹 설명
                </label>
              </div>
            </div>

            {/* 공개/비공개 토글 (좌측 정렬) */}
            <div className="w-full text-left mb-4">
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
                    onChange={(e) => setGroupVisibility(e.target.checked ? "public" : "private")}
                  />
                  <div
                    className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 
                               peer-focus:ring-blue-300 rounded-full 
                               dark:bg-gray-700 
                               peer-checked:after:translate-x-full peer-checked:after:border-white 
                               after:content-[''] after:absolute after:top-0.5 after:left-[2px] 
                               after:bg-white after:border-gray-300 after:border after:rounded-full 
                               after:h-5 after:w-5 after:transition-all dark:border-gray-600 
                               peer-checked:bg-blue-600"
                  ></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {groupVisibility === "public" ? "공개" : "비공개"}
                  </span>
                </label>
              </div>
            </div>

            {formError && <div className="w-full mt-2 text-red-500 text-sm">{formError}</div>}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 w-full">
          <div className="flex justify-between">
            <button
              onClick={onCloseModal}
              className="flex-1 mr-2 h-10 bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
            >
              <span className="text-gray-800 text-sm block">취소</span>
            </button>
            <button
              onClick={onCreateGroup}
              className="flex-1 ml-2 h-10 bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              <span className="text-white text-sm block">생성</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupCreation;
