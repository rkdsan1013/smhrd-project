// /frontend/src/components/ProfileCard.tsx
import React, { useState, useEffect, useRef } from "react";

interface Profile {
  name: string;
  email: string;
  profile_picture?: string;
}

interface ProfileCardProps {
  profile: Profile;
  onClose: () => void;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ profile, onClose }) => {
  // 드래그 후의 좌표를 저장합니다.
  const [pos, setPos] = useState({ x: 0, y: 0 });
  // 드래그가 발생했는지 여부 (false이면 CSS 중앙 배치)
  const [hasDragged, setHasDragged] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 페이드 효과를 위한 상태
  const [isVisible, setIsVisible] = useState(false);
  // 모달 엘리먼트에 접근하기 위한 ref
  const modalRef = useRef<HTMLDivElement>(null);

  // 모달이 마운트되면 짧은 지연 후 fade-in 효과 적용
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // 헤더 영역에서만 드래그 시작 (닫기 버튼 클릭은 이벤트 전파 차단)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!hasDragged && modalRef.current) {
      // 드래그 시 모달의 현재 위치(중앙 배치된 위치)를 픽셀 좌표로 변환
      const rect = modalRef.current.getBoundingClientRect();
      setPos({ x: rect.left, y: rect.top });
      setHasDragged(true);
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    } else {
      setDragStart({
        x: e.clientX - pos.x,
        y: e.clientY - pos.y,
      });
    }
    setIsDragging(true);
  };

  // 전역 마우스 이동을 통해 모달의 위치 갱신 (브라우저 경계 제한 포함)
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    let newX = e.clientX - dragStart.x;
    let newY = e.clientY - dragStart.y;

    if (modalRef.current) {
      const modalWidth = modalRef.current.offsetWidth;
      const modalHeight = modalRef.current.offsetHeight;
      newX = Math.max(0, Math.min(newX, window.innerWidth - modalWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - modalHeight));
    }
    setPos({ x: newX, y: newY });
  };

  // 마우스 업 시 드래그 종료
  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 중인 동안 전역 이벤트 리스너 등록/해제
  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, dragStart]);

  // 모달 종료 시 fade-out 효과 후 onClose 호출
  const handleCloseWithFade = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // 모달 스타일: 드래그 전이면 CSS 중앙 배치, 드래그 후면 픽셀 값 사용 (문자열로 변환)
  const modalStyle: React.CSSProperties = hasDragged
    ? { top: `${pos.y}px`, left: `${pos.x}px`, position: "absolute" }
    : {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        position: "absolute",
      };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className={`absolute inset-0 transition-opacity duration-300 bg-black/60 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleCloseWithFade}
      ></div>
      <div
        ref={modalRef}
        className={`relative z-10 bg-white rounded-lg shadow-xl w-80 select-none transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
        style={modalStyle}
      >
        {/* 헤더 (드래그 영역) */}
        <div className="p-4 border-b border-gray-200 relative" onMouseDown={handleMouseDown}>
          <h2 className="text-xl font-bold">프로필 정보</h2>
          <button
            // 드래그 이벤트 방지를 위해 onMouseDown 전파 차단
            onMouseDown={(e) => e.stopPropagation()}
            onClick={handleCloseWithFade}
            className="absolute top-2 right-2 w-10 h-10 flex items-center justify-center rounded-full text-gray-600 hover:bg-gray-300 transition-colors duration-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {/* 모달 내부 내용 */}
        <div className="p-4">
          <div className="flex items-center space-x-4 mt-4">
            {profile.profile_picture ? (
              <img
                src={profile.profile_picture}
                alt={profile.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gray-300" />
            )}
            <div>
              <h2 className="text-xl font-bold">{profile.name}</h2>
              <p className="text-gray-600">{profile.email}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileCard;
