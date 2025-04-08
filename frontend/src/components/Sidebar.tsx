// /frontend/src/components/Sidebar.tsx
import React, { useState, useEffect, useRef, MouseEvent } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import GroupCreation from "./GroupCreation";
import { getMyGroups, GroupInfo } from "../services/groupService";

interface Group extends GroupInfo {
  image: string;
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

const Tooltip: React.FC<TooltipProps> = ({ text, style, placement, className }) => {
  const arrowClasses =
    placement === "right"
      ? "after:content-[''] after:absolute after:top-1/2 after:left-[-6px] after:-translate-y-1/2 after:border-t-[6px] after:border-b-[6px] after:border-t-transparent after:border-b-transparent after:border-r-[6px] after:border-r-gray-700/75"
      : "after:content-[''] after:absolute after:left-1/2 after:top-[-6px] after:-translate-x-1/2 after:border-l-[6px] after:border-r-[6px] after:border-l-transparent after:border-r-transparent after:border-b-[6px] after:border-b-gray-700/75";
  return ReactDOM.createPortal(
    <div
      style={style}
      className={`fixed z-50 transition-opacity duration-200 bg-gray-700/75 rounded-lg shadow-lg text-white text-sm flex items-center whitespace-nowrap ${
        className || "px-3 py-2"
      } ${arrowClasses}`}
    >
      {text}
    </div>,
    document.body,
  );
};

const tooltipGap = 8;
const hoverDelay = 100;

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

interface SidebarProps {
  onHomeSelect: () => void;
  onGroupSearchSelect: () => void;
  // 수정된 타입: 그룹 UUID와 그룹 이름 두 개의 인자를 받음.
  onGroupSelect: (groupUuid: string, groupName: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onHomeSelect, onGroupSearchSelect, onGroupSelect }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tooltips, setTooltips] = useState<TooltipState[]>([]);
  const tooltipIdCounter = useRef(0);
  const hoverTimeoutRef = useRef<number | null>(null);
  const [isGroupCreationModalOpen, setIsGroupCreationModalOpen] = useState(false);

  useEffect(() => {
    async function fetchGroups() {
      try {
        const fetchedGroups = await getMyGroups();
        const mappedGroups: Group[] = fetchedGroups.map((group) => ({
          ...group,
          image: group.group_icon || "",
        }));
        setGroups(mappedGroups);
      } catch (error) {
        console.error("그룹 불러오기 실패:", error);
      }
    }
    fetchGroups();
  }, []);

  // 그룹 버튼 클릭 시, 그룹의 UUID와 이름을 부모에게 전달
  const navigateTo = (groupUuid: string, groupName: string) => {
    onGroupSelect(groupUuid, groupName);
  };

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

  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>, text: string) => {
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

  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
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

  const handleGroupCreated = (newGroup: GroupInfo) => {
    const mappedGroup: Group = { ...newGroup, image: newGroup.group_icon || "" };
    setGroups((prev) => [...prev, mappedGroup]);
  };

  return (
    <>
      <aside className="w-full h-20 md:w-20 md:h-full bg-white rounded-lg shadow-lg p-2">
        <div className="flex flex-row md:flex-col h-full">
          {/* 메인 버튼 */}
          <div className="flex-shrink-0 flex items-center justify-center relative">
            <button
              onClick={onHomeSelect}
              onMouseEnter={(e) => handleMouseEnter(e, "메인 화면")}
              onMouseLeave={handleMouseLeave}
              className="flex items-center justify-center focus:outline-none hover:scale-105 active:scale-95 transition-transform duration-200"
            >
              <Icons
                name="home"
                className="w-8 h-8 text-gray-700 hover:text-blue-600 duration-300"
              />
            </button>
          </div>

          {/* 구분선 */}
          <div className="flex items-center">
            <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
            <div className="hidden md:block w-full border-t border-gray-300 my-2" />
          </div>

          {/* 그룹 목록 */}
          <div className="relative flex-1 overflow-auto mx-2 md:mx-0 my-1 md:my-2">
            <div className="no-scrollbar flex flex-row md:flex-col gap-3 overflow-auto w-full h-full px-4 md:px-0 md:py-4 items-center justify-start">
              {groups.map((group) => (
                <div key={group.uuid} className="relative flex-shrink-0">
                  <button
                    onClick={() => navigateTo(group.uuid, group.name)}
                    onMouseEnter={(e) => handleMouseEnter(e, group.name)}
                    onMouseLeave={handleMouseLeave}
                    className="flex items-center justify-center rounded-full overflow-hidden hover:opacity-80 hover:scale-105 active:scale-95 hover:shadow-lg transition-transform duration-200 transform focus:outline-none"
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
            {/* 모바일 그라데이션 */}
            <div className="block md:hidden pointer-events-none absolute inset-y-0 left-0 w-4 z-0 bg-gradient-to-r from-white to-transparent" />
            <div className="block md:hidden pointer-events-none absolute inset-y-0 right-0 w-4 z-0 bg-gradient-to-l from-white to-transparent" />
            {/* 데스크탑 그라데이션 */}
            <div className="hidden md:block pointer-events-none absolute inset-x-0 top-0 h-4 z-0 bg-gradient-to-b from-white to-transparent" />
            <div className="hidden md:block pointer-events-none absolute inset-x-0 bottom-0 h-4 z-0 bg-gradient-to-t from-white to-transparent" />
          </div>

          {/* 구분선 */}
          <div className="flex items-center">
            <div className="block md:hidden h-full border-l border-gray-300 mx-2" />
            <div className="hidden md:block w-full border-t border-gray-300 my-2" />
          </div>

          {/* 추가 버튼들 */}
          <div className="flex flex-row md:flex-col flex-shrink-0 p-1 gap-2">
            <div className="relative flex items-center justify-center">
              <button
                onClick={() => setIsGroupCreationModalOpen(true)}
                onMouseEnter={(e) => handleMouseEnter(e, "그룹 생성")}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center focus:outline-none hover:scale-105 active:scale-95 transition-transform duration-200"
              >
                <Icons
                  name="plus"
                  className="w-8 h-8 text-gray-700 hover:text-blue-600 duration-300"
                />
              </button>
            </div>
            <div className="relative flex items-center justify-center">
              <button
                onClick={onGroupSearchSelect}
                onMouseEnter={(e) => handleMouseEnter(e, "그룹 검색")}
                onMouseLeave={handleMouseLeave}
                className="flex items-center justify-center focus:outline-none hover:scale-105 active:scale-95 transition-transform duration-200"
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

      {isGroupCreationModalOpen && (
        <GroupCreation
          onClose={() => setIsGroupCreationModalOpen(false)}
          onCreate={handleGroupCreated}
        />
      )}
    </>
  );
};

export default Sidebar;
