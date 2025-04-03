// /frontend/src/components/Sidebar.tsx
import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";

interface Group {
  uuid: string;
  image: string;
  name: string;
}

interface TooltipState {
  id: number;
  text: string;
  style: React.CSSProperties;
  placement: "right" | "bottom";
}

interface TooltipProps {
  text: string;
  style: React.CSSProperties;
  placement: "right" | "bottom";
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({ text, style, placement, className }) =>
  ReactDOM.createPortal(
    <div style={style} className="fixed z-50 transition-opacity duration-200">
      <div
        className={`relative bg-gray-700 text-white text-sm rounded-lg shadow-lg flex items-center whitespace-nowrap ${
          className || "px-3 py-2"
        }`}
      >
        {text}
        {/* 화살표 요소 – 데스크탑은 왼쪽, 모바일은 위쪽에 위치 */}
        {placement === "right" && (
          <div className="absolute left-[-4px] top-1/2 transform -translate-y-1/2 rotate-45 bg-gray-700 w-3 h-3" />
        )}
        {placement === "bottom" && (
          <div className="absolute top-[-4px] left-1/2 transform -translate-x-1/2 rotate-45 bg-gray-700 w-3 h-3" />
        )}
      </div>
    </div>,
    document.body,
  );

const tooltipGap = 8; // 버튼과 툴팁 사이 간격
const hoverDelay = 100; // 100ms delay

const calcTooltipStyle = (rect: DOMRect, isDesktop: boolean): React.CSSProperties =>
  isDesktop
    ? {
        position: "fixed",
        left: rect.right + tooltipGap,
        top: rect.top + rect.height / 2,
        transform: "translateY(-50%)",
      }
    : {
        position: "fixed",
        left: rect.left + rect.width / 2,
        top: rect.bottom + tooltipGap,
        transform: "translateX(-50%)",
      };

const Sidebar: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tooltips, setTooltips] = useState<TooltipState[]>([]);
  const tooltipIdCounter = useRef(0);
  const hoverTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const dummyGroups: Group[] = Array.from({ length: 20 }, (_, i) => ({
      uuid: `uuid-${i + 1}`,
      image: ``,
      name: `그룹 ${i + 1}`,
    }));
    setGroups(dummyGroups);
  }, []);

  const navigateTo = (groupUuid: string) => alert(`그룹 UUID: ${groupUuid}로 이동합니다.`);

  const addTooltip = (target: HTMLElement, text: string): number => {
    const rect = target.getBoundingClientRect();
    const isDesktop = window.innerWidth >= 768;
    const placement: "right" | "bottom" = isDesktop ? "right" : "bottom";
    const baseStyle = calcTooltipStyle(rect, isDesktop);
    const newId = tooltipIdCounter.current++;
    const newTooltip: TooltipState = {
      id: newId,
      text,
      style: { ...baseStyle, opacity: 0 },
      placement,
    };
    setTooltips((prev) => [...prev, newTooltip]);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setTooltips((prev) =>
          prev.map((tt) => (tt.id === newId ? { ...tt, style: { ...tt.style, opacity: 1 } } : tt)),
        );
      });
    });
    return newId;
  };

  const removeTooltip = (id: number) => {
    setTooltips((prev) =>
      prev.map((tt) => (tt.id === id ? { ...tt, style: { ...tt.style, opacity: 0 } } : tt)),
    );
    setTimeout(() => {
      setTooltips((prev) => prev.filter((tt) => tt.id !== id));
    }, 200);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, text: string) => {
    const target = e.currentTarget;
    target.removeAttribute("data-tooltip-id");
    hoverTimeoutRef.current = window.setTimeout(() => {
      if (target.matches(":hover")) {
        const id = addTooltip(target, text);
        target.setAttribute("data-tooltip-id", id.toString());
      }
      hoverTimeoutRef.current = null;
    }, hoverDelay);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    if (hoverTimeoutRef.current !== null) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    const idStr = target.getAttribute("data-tooltip-id");
    if (idStr) {
      removeTooltip(Number(idStr));
      target.removeAttribute("data-tooltip-id");
    }
  };

  return (
    <>
      <aside className="w-full h-20 md:w-20 md:h-full bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-row md:flex-col h-full">
          <div className="flex-shrink-0 flex items-center justify-center relative">
            <button
              onClick={() => navigateTo("home")}
              onMouseEnter={(e) => handleMouseEnter(e, "메인 화면")}
              onMouseLeave={handleMouseLeave}
              className="flex items-center justify-center focus:outline-none"
            >
              <Icons
                name="home"
                className="w-8 h-8 text-gray-700 hover:text-blue-600 duration-300"
              />
            </button>
          </div>
          <div className="flex items-center">
            <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
            <div className="hidden md:block w-full border-t border-gray-300 my-2" />
          </div>
          <div className="relative flex-1 overflow-auto mx-2 md:mx-0 my-1 md:my-2">
            <div className="no-scrollbar flex flex-row md:flex-col gap-3 overflow-auto w-full h-full px-4 md:px-0 md:py-4 items-center justify-start">
              {groups.map((group) => (
                <div key={group.uuid} className="relative flex-shrink-0">
                  <button
                    onClick={() => navigateTo(group.uuid)}
                    onMouseEnter={(e) => handleMouseEnter(e, group.name)}
                    onMouseLeave={handleMouseLeave}
                    className="flex items-center justify-center hover:opacity-80 focus:outline-none"
                  >
                    {group.image ? (
                      <img
                        src={group.image}
                        alt={group.name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gray-300" />
                    )}
                  </button>
                </div>
              ))}
            </div>
            <div className="block md:hidden pointer-events-none absolute inset-y-0 left-0 w-4 z-0 bg-gradient-to-r from-white to-transparent" />
            <div className="block md:hidden pointer-events-none absolute inset-y-0 right-0 w-4 z-0 bg-gradient-to-l from-white to-transparent" />
            <div className="hidden md:block pointer-events-none absolute inset-x-0 top-0 h-4 z-0 bg-gradient-to-b from-white to-transparent" />
            <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0 h-4 z-0 bg-gradient-to-t from-white to-transparent" />
          </div>
          <div className="flex items-center">
            <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
            <div className="hidden md:block w-full border-t border-gray-300 my-2" />
          </div>
          <div className="flex flex-row md:flex-col flex-shrink-0 p-1 gap-2">
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => navigateTo("create-group")}
                onMouseEnter={(e) => handleMouseEnter(e, "그룹 생성")}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center focus:outline-none"
              >
                <Icons
                  name="plus"
                  className="w-8 h-8 text-gray-700 hover:text-blue-600 duration-300"
                />
              </button>
            </div>
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => navigateTo("search-group")}
                onMouseEnter={(e) => handleMouseEnter(e, "그룹 검색")}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center focus:outline-none"
              >
                <Icons
                  name="search"
                  className="w-8 h-8 text-gray-700 hover:text-blue-600 duration-300"
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
      {tooltips.map((tt) => (
        <Tooltip key={tt.id} text={tt.text} style={tt.style} placement={tt.placement} />
      ))}
    </>
  );
};

export default Sidebar;
