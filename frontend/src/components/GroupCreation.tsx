// /frontend/src/components/GroupCreation.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import Icons from "./Icons";

// 입력 필드 및 라벨 스타일
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left transition-transform duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface GroupCreationProps {
  onClose: () => void;
}

const GroupCreation: React.FC<GroupCreationProps> = ({ onClose }) => {
  // 단계: 그룹 생성("creation") / 그룹 설정("settings")
  const [step, setStep] = useState<"creation" | "settings">("creation");

  // 모달 애니메이션 및 높이 조절 관련 상태와 Ref
  const [isVisible, setIsVisible] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // 그룹 정보 상태 (내부 내용 변경 없음)
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupIcon, setGroupIcon] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string | null>(null);
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const [groupPicturePreview, setGroupPicturePreview] = useState<string | null>(null);
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("private");
  const [formError, setFormError] = useState("");

  // 모달 페이드 인 효과
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

  // 높이 조절 함수
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
        outerRef.current.getBoundingClientRect(); // 강제 reflow
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
  ]);

  // 그룹 아이콘 변경 핸들러
  const onGroupIconChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormError("");
      setGroupIcon(file);
      const reader = new FileReader();
      reader.onloadend = () => setGroupIconPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 그룹 배경 사진 변경 핸들러 (옵션)
  const onGroupPictureChangeSettings = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormError("");
      setGroupPicture(file);
      const reader = new FileReader();
      reader.onloadend = () => setGroupPicturePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  // 그룹 생성 제출 (그룹 사진은 선택사항)
  const onSubmitGroup = async () => {
    try {
      // API 호출: { groupName, groupDescription, groupIcon, groupPicture, groupVisibility }
      alert("그룹이 생성되었습니다.");
      onCloseModal();
    } catch (error: any) {
      setFormError(error.message || "그룹 생성 중 오류가 발생했습니다.");
    }
  };

  const onCloseModal = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  // "다음" 버튼: 생성 → 설정 전환
  const goToSettings = () => {
    if (!groupName.trim()) {
      setFormError("그룹 이름을 입력해 주세요.");
      return;
    }
    setFormError("");
    setStep("settings");
  };

  // "이전" 버튼: 설정 → 생성 전환 (데이터 유지)
  const goToCreation = () => {
    setStep("creation");
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={onCloseModal}
      />
      {/* 모달 */}
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
        {/* 헤더 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">{step === "creation" ? "그룹 생성" : "그룹 설정"}</h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {/* 내용 */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 space-y-6">
            {step === "creation" && (
              <div className="flex flex-col items-center space-y-4">
                {/* 그룹 아이콘 */}
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
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                  </label>
                  <input
                    type="file"
                    id="groupIcon"
                    accept="image/*"
                    onChange={onGroupIconChange}
                    className="hidden"
                  />
                </div>
                {/* 그룹 이름 */}
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
                {/* 그룹 설명 */}
                <div className="w-full">
                  <div className="relative">
                    <textarea
                      id="groupDescription"
                      value={groupDescription}
                      onChange={(e) => {
                        setGroupDescription(e.target.value);
                        setFormError("");
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
                {/* 공개/비공개 토글 */}
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
            )}
            {step === "settings" && (
              <div className="space-y-6">
                {/* 상단: 그룹 아이콘, 그룹 이름, 공개 여부 */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden">
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
                    <div className="text-left">
                      <p className="text-lg font-semibold">{groupName}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-900">
                    {groupVisibility === "public" ? "공개" : "비공개"}
                  </div>
                </div>
                {/* 그룹 배경 사진 */}
                <div>
                  <label
                    htmlFor="groupPicture"
                    className="relative group block w-full h-64 mb-4 rounded-lg overflow-hidden bg-gray-200 cursor-pointer"
                  >
                    <div className="w-full h-full">
                      {groupPicturePreview ? (
                        <img
                          src={groupPicturePreview}
                          alt="그룹 배경 사진 미리보기"
                          className="w-full h-full object-cover"
                        />
                      ) : null}
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300" />
                  </label>
                  <input
                    type="file"
                    id="groupPicture"
                    accept="image/*"
                    onChange={onGroupPictureChangeSettings}
                    className="hidden"
                  />
                </div>
                {/* 그룹 설명 미리보기 */}
                <div className="text-left">
                  <p className="text-base font-medium text-gray-800 mb-1">그룹 설명</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{groupDescription}</p>
                </div>
                {formError && <p className="w-full text-red-500 text-sm text-left">{formError}</p>}
              </div>
            )}
          </div>
        </div>
        {/* 푸터: 버튼 영역 */}
        <div className="p-4 border-t border-gray-200">
          {step === "creation" ? (
            <div className="flex justify-between">
              <button
                onClick={onCloseModal}
                className="flex-1 mr-2 h-10 bg-gray-300 rounded-lg transition-colors duration-300 hover:bg-gray-400"
              >
                <span className="text-gray-800 text-sm">취소</span>
              </button>
              <button
                onClick={goToSettings}
                className="flex-1 ml-2 h-10 bg-green-500 rounded-lg transition-colors duration-300 hover:bg-green-600"
              >
                <span className="text-white text-sm">다음</span>
              </button>
            </div>
          ) : (
            <div className="flex justify-between">
              <button
                onClick={goToCreation}
                className="flex-1 mr-2 h-10 bg-gray-300 rounded-lg transition-colors duration-300 hover:bg-gray-400"
              >
                <span className="text-gray-800 text-sm">이전</span>
              </button>
              <button
                onClick={onSubmitGroup}
                className="flex-1 ml-2 h-10 bg-green-500 rounded-lg transition-colors duration-300 hover:bg-green-600"
              >
                <span className="text-white text-sm">생성</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GroupCreation;
