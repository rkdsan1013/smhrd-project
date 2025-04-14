// /frontend/src/components/ScheduleListView.tsx

import { useMemo, useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import type { Schedule } from "../contexts/ScheduleContext";
import moment from "moment";
import Icons from "./Icons";

interface ScheduleListViewProps {
  filterType: "all" | "personal" | "group";
}

export interface ScheduleListViewHandle {
  scrollNext: () => void;
  scrollPrev: () => void;
  scrollToToday: () => void;
}

const formatScheduleDate = (schedule: Schedule): string => {
  if (schedule.allDay) {
    const startDate = moment(schedule.start_time);
    const adjustedEndDate = moment(schedule.end_time).subtract(1, "day");
    return startDate.isSame(adjustedEndDate, "day")
      ? startDate.format("YYYY-MM-DD")
      : `${startDate.format("YYYY-MM-DD")} ~ ${adjustedEndDate.format("YYYY-MM-DD")}`;
  } else {
    return `${moment(schedule.start_time).format("YYYY-MM-DD HH:mm")} - ${moment(
      schedule.end_time,
    ).format("YYYY-MM-DD HH:mm")}`;
  }
};

const ScheduleListView = forwardRef<ScheduleListViewHandle, ScheduleListViewProps>(
  ({ filterType }, ref) => {
    const { schedules } = useSchedule();
    const nowTime = Date.now();

    // 1. 필터링: 모든 all-day 일정은 항상 포함, 일반 일정은 현재 진행 중인 일정만 포함
    const filteredSchedules = useMemo(() => {
      const now = Date.now();
      let filtered = schedules.filter((schedule) => {
        if (!schedule.allDay) {
          const start = new Date(schedule.start_time).getTime();
          const end = new Date(schedule.end_time).getTime();
          return now >= start && now <= end;
        }
        return true;
      });
      if (filterType !== "all") {
        filtered = filtered.filter((schedule) => schedule.type === filterType);
      }
      return filtered;
    }, [schedules, filterType]);

    // 2. 정렬: 그룹 번호 부여 (0: 종료, 1: 진행 중(all-day → "현재 일정"), 2: 진행 중(일반 → "진행중"), 3: 시작 예정)
    // 수정된 정렬 로직: 일정 시작 날짜(YYYY-MM-DD)가 같으면, 종료 시간이 빠른 순서대로 정렬
    const sortedSchedules = useMemo<Schedule[]>(() => {
      return [...filteredSchedules].sort((a, b) => {
        const now = Date.now();
        const aStart = new Date(a.start_time).getTime();
        const aEnd = new Date(a.end_time).getTime();
        const bStart = new Date(b.start_time).getTime();
        const bEnd = new Date(b.end_time).getTime();

        const aPast = now > aEnd;
        const aActive = now >= aStart && now <= aEnd;
        const aOrder = aPast ? 0 : aActive ? (a.allDay ? 1 : 2) : 3;

        const bPast = now > bEnd;
        const bActive = now >= bStart && now <= bEnd;
        const bOrder = bPast ? 0 : bActive ? (b.allDay ? 1 : 2) : 3;

        if (aOrder !== bOrder) return aOrder - bOrder;

        // 시작 날짜(YYYY-MM-DD)가 같으면, 종료 시간이 빠른 순서로 정렬
        const aStartDate = moment(a.start_time).format("YYYY-MM-DD");
        const bStartDate = moment(b.start_time).format("YYYY-MM-DD");
        if (aStartDate === bStartDate) {
          return aEnd - bEnd;
        }
        return aStart - bStart;
      });
    }, [filteredSchedules]);

    // 첫 upcoming 일정의 인덱스 (그룹 3에 해당하는 이벤트 중 가장 첫 이벤트)
    const firstUpcomingIndex = useMemo(() => {
      return sortedSchedules.findIndex((schedule) => {
        const start = new Date(schedule.start_time).getTime();
        return nowTime < start;
      });
    }, [sortedSchedules, nowTime]);

    const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);

    const scrollToIndex = (index: number) => {
      if (index >= 0 && index < sortedSchedules.length && itemRefs.current[index]) {
        setCurrentIndex(index);
        itemRefs.current[index]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    };

    const scrollNext = () => {
      if (currentIndex < sortedSchedules.length - 1) {
        scrollToIndex(currentIndex + 1);
      }
    };

    const scrollPrev = () => {
      if (currentIndex > 0) {
        scrollToIndex(currentIndex - 1);
      }
    };

    // scrollToToday: 우선 일반(진행중) 일정을 우선 탐색한 후, 없으면 active 전체, 그 외 미래 일정으로 스크롤
    const scrollToToday = () => {
      const now = Date.now();
      let index = sortedSchedules.findIndex((s) => {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        // 일반 일정이면서 active인 경우 우선 선택
        return !s.allDay && now >= start && now <= end;
      });
      if (index === -1) {
        // 없으면 active인 모든 일정(즉, all-day 포함)에서 찾기
        index = sortedSchedules.findIndex((s) => {
          const start = new Date(s.start_time).getTime();
          const end = new Date(s.end_time).getTime();
          return now >= start && now <= end;
        });
      }
      if (index === -1) {
        index = sortedSchedules.findIndex((s) => new Date(s.start_time).getTime() > now);
      }
      if (index === -1) {
        index = 0;
      }
      scrollToIndex(index);
    };

    useImperativeHandle(ref, () => ({
      scrollNext,
      scrollPrev,
      scrollToToday,
    }));

    // 초기 스크롤: 진행중(Active) 일정 중 일반(진행중) 일정 우선, 없으면 active 전체, 그 외 미래 이벤트로
    useEffect(() => {
      const now = Date.now();
      let initialIndex = sortedSchedules.findIndex((s) => {
        const start = new Date(s.start_time).getTime();
        const end = new Date(s.end_time).getTime();
        // 일반 일정 중 진행중(진행중) 일정 우선
        return !s.allDay && now >= start && now <= end;
      });
      if (initialIndex === -1) {
        initialIndex = sortedSchedules.findIndex((s) => {
          const start = new Date(s.start_time).getTime();
          const end = new Date(s.end_time).getTime();
          return now >= start && now <= end;
        });
      }
      if (initialIndex === -1) {
        initialIndex = sortedSchedules.findIndex((s) => new Date(s.start_time).getTime() > now);
      }
      if (initialIndex === -1) {
        initialIndex = 0;
      }
      setCurrentIndex(initialIndex);
      if (itemRefs.current[initialIndex]) {
        itemRefs.current[initialIndex]?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
    }, [sortedSchedules]);

    return (
      <div className="h-full p-4 flex flex-col gap-4 overflow-y-auto">
        {sortedSchedules.length === 0 ? (
          <div className="text-gray-500">일정이 없습니다.</div>
        ) : (
          sortedSchedules.map((schedule, index) => {
            const scheduleStart = new Date(schedule.start_time).getTime();
            const scheduleEnd = new Date(schedule.end_time).getTime();
            const now = Date.now();
            const isPast = now > scheduleEnd;
            const isActive = now >= scheduleStart && now <= scheduleEnd;
            const isUpcoming = !isPast && !isActive;

            // 뱃지 텍스트 및 스타일 결정
            let badgeText = "";
            let badgeClass = "";
            if (isPast) {
              badgeText = "종료";
              badgeClass = "bg-gray-500";
            } else if (isActive) {
              badgeText = schedule.allDay ? "현재 일정" : "진행중";
              badgeClass = "bg-blue-500";
            } else if (isUpcoming && index === firstUpcomingIndex) {
              badgeText = "다음 일정";
              badgeClass = "bg-green-500";
            }

            // 일반(시간대) 일정의 진행율 계산 (all-day 일정은 progress bar 생략)
            let progressPercent = 0;
            if (isActive && !schedule.allDay) {
              const total = scheduleEnd - scheduleStart;
              const elapsed = now - scheduleStart;
              progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));
            }

            // dDay 레이블: 첫 upcoming 일정에 한하여
            let dDayLabel = "";
            if (isUpcoming && index === firstUpcomingIndex) {
              const startDate = moment(schedule.start_time).startOf("day");
              const today = moment().startOf("day");
              const daysLeft = startDate.diff(today, "days");
              dDayLabel = daysLeft === 0 ? "D-day" : `D-${daysLeft}`;
            }

            return (
              <div
                key={schedule.uuid}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                onClick={() => alert(`UUID: ${schedule.uuid}`)}
                className={`relative ${
                  isPast ? "bg-gray-200" : "bg-white"
                } shadow rounded p-4 cursor-pointer transition-all duration-200 hover:bg-indigo-50 hover:border-indigo-400 ${
                  isActive ? "border-2 border-blue-500" : "border border-transparent"
                }`}
              >
                {/* 진행 중이며 일반 일정인 경우 진행률 progress bar 표시 */}
                {isActive && !schedule.allDay && (
                  <div className="absolute top-0 left-0 h-1 w-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                {/* 뱃지 표시 */}
                {badgeText && (
                  <span
                    className={`absolute top-1 right-0 ${badgeClass} text-white text-xs px-2 py-1 rounded-bl z-10`}
                  >
                    {badgeText}
                  </span>
                )}

                {/* 첫 upcoming 일정에 대한 dDay 레이블 */}
                {isUpcoming && index === firstUpcomingIndex && (
                  <span className="absolute top-7 right-0 bg-yellow-400 text-white text-xs px-2 py-1 rounded-bl z-10">
                    {dDayLabel}
                  </span>
                )}

                <div className="flex items-center">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded mr-2 ${
                      schedule.type === "personal"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {schedule.type === "personal" ? "개인" : "그룹"}
                  </span>
                  <div className="text-sm text-gray-500">{formatScheduleDate(schedule)}</div>
                </div>

                <div className="text-lg font-bold mt-1 truncate" title={schedule.title}>
                  {schedule.title}
                </div>

                {schedule.location && (
                  <div
                    className="text-gray-700 mt-2 truncate flex items-center gap-1"
                    title={schedule.location}
                  >
                    <Icons name="mapPinAlt" className="w-4 h-4 text-gray-500" />
                    <span className="truncate">{schedule.location}</span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    );
  },
);

export default ScheduleListView;
