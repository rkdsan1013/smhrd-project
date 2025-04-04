// /frontend/src/components/GroupCreation.tsx
import React, { useState, useEffect, useLayoutEffect, useRef, ChangeEvent } from "react";
import Icons from "./Icons";

const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface GroupCreationProps {
  onClose: () => void;
}

const GroupCreation: React.FC<GroupCreationProps> = ({ onClose }) => {
  // 단계: "creation"(생성) / "settings"(설정)
  const [step, setStep] = useState<"creation" | "settings">("creation");
  const [isVisible, setIsVisible] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [formError, setFormError] = useState("");

  // 그룹 정보 상태
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupIcon, setGroupIcon] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string | null>(null);
  const [groupPicture, setGroupPicture] = useState<File | null>(null);
  const [groupPicturePreview, setGroupPicturePreview] = useState<string | null>(null);
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">("private");

  // 모달 높이 조절용 Ref
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const oldHeightRef = useRef<number | null>(null);

  // 모달 fade in 효과
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 최초 마운트 시 모달 높이 설정
  useEffect(() => {
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.height = `${innerRef.current.offsetHeight}px`;
      outerRef.current.style.transition = "height 0.3s ease-in-out";
    }
    setHasMounted(true);
  }, []);

  // 내용에 따라 모달 높이를 조절하는 함수 (애니메이션 효과)
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
        // 강제 리플로우
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
  ]);

  // 공통 파일 변경 이벤트 핸들러 함수
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

  // 상태 전환 전 현재 높이 기록
  const captureHeight = () => {
    if (outerRef.current) {
      oldHeightRef.current = outerRef.current.offsetHeight;
    }
  };

  // 단계 전환 핸들러
  const goToSettings = () => {
    if (!groupName.trim()) {
      setFormError("그룹 이름을 입력해 주세요.");
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

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
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
        {/* 헤더 영역 */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">{step === "creation" ? "그룹 생성" : "그룹 설정"}</h2>
          <button
            onClick={onCloseModal}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {/* 내용 영역 */}
        <div ref={outerRef} style={{ overflow: "hidden" }}>
          <div ref={innerRef} className="p-6 space-y-6">
            {step === "creation" ? (
              <div className="flex flex-col items-center space-y-4">
                {/* 그룹 아이콘 영역 */}
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
                    {/* 배경 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                    {/* 중앙 아이콘 */}
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
                {/* 그룹 설명 입력 영역 */}
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
                    rows={3}
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
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
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
                {/* 그룹 배경 사진 영역 */}
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
                    {/* 배경 오버레이 */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                    {/* 중앙 아이콘 */}
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
                {/* 그룹 설명 미리보기 */}
                <div className="text-left">
                  <p className="text-base font-medium text-gray-800 mb-1">그룹 설명</p>
                  <div style={{ maxHeight: "15rem", overflowY: "auto" }}>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{groupDescription}</p>
                  </div>
                </div>
                {formError && <p className="w-full text-red-500 text-sm text-left">{formError}</p>}
              </div>
            )}
          </div>
        </div>
        {/* 푸터 (버튼 영역) */}
        <div className="p-4 border-t border-gray-200">
          {step === "creation" ? (
            <div className="grid grid-cols-2 gap-2" key="form-footer">
              <div className="h-10 w-full" />
              <button
                onClick={goToSettings}
                className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
              >
                <span className="text-white text-sm">다음</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2" key="form-footer">
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
    </div>
  );
};

export default GroupCreation;
