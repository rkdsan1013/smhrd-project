import React, { useMemo, useEffect, useRef } from "react";
import { useSchedule } from "../contexts/ScheduleContext";
import type { Schedule } from "../contexts/ScheduleContext";
import moment from "moment";
import Icons from "./Icons";

interface ScheduleListViewProps {
  filterType: "all" | "personal" | "group";
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

const ScheduleListView: React.FC<ScheduleListViewProps> = ({ filterType }) => {
  const { schedules } = useSchedule();
  const now = new Date();

  const filteredSchedules = useMemo(() => {
    return filterType === "all"
      ? schedules
      : schedules.filter((schedule) => schedule.type === filterType);
  }, [schedules, filterType]);

  const sortedSchedules = useMemo<Schedule[]>(() => {
    return [...filteredSchedules].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
  }, [filteredSchedules]);

  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const nowTime = now.getTime();

    let scrollIndex = sortedSchedules.findIndex(
      (s) =>
        nowTime >= new Date(s.start_time).getTime() && nowTime <= new Date(s.end_time).getTime(),
    );

    if (scrollIndex === -1) {
      scrollIndex = sortedSchedules.findIndex((s) => new Date(s.start_time).getTime() > nowTime);
    }

    if (scrollIndex !== -1 && itemRefs.current[scrollIndex]) {
      itemRefs.current[scrollIndex]?.scrollIntoView({
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
          const nowTime = now.getTime();

          const isActive = nowTime >= scheduleStart && nowTime <= scheduleEnd;

          const isNext =
            !isActive &&
            scheduleStart > nowTime &&
            sortedSchedules.findIndex(
              (s) =>
                new Date(s.start_time).getTime() > nowTime &&
                !(
                  nowTime >= new Date(s.start_time).getTime() &&
                  nowTime <= new Date(s.end_time).getTime()
                ),
            ) === index;

          const total = scheduleEnd - scheduleStart;
          const elapsed = nowTime - scheduleStart;
          const progressPercent = isActive
            ? Math.min(100, Math.max(0, (elapsed / total) * 100))
            : 0;

          const startDate = moment(schedule.start_time).startOf("day");
          const today = moment().startOf("day");
          const daysLeft = startDate.diff(today, "days");
          const dDayLabel = daysLeft === 0 ? "D-day" : `D-${daysLeft}`;

          return (
            <div
              key={schedule.uuid}
              ref={(el) => {
                itemRefs.current[index] = el;
              }}
              onClick={() => alert(`UUID: ${schedule.uuid}`)}
              className={`relative bg-white shadow rounded p-4 cursor-pointer transition-all duration-200
                hover:bg-indigo-50 hover:border-indigo-400
                ${isActive ? "border-2 border-blue-500" : "border border-transparent"}`}
            >
              {isActive && (
                <>
                  <div className="absolute top-0 left-0 h-1 w-full bg-gray-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-200"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <span className="absolute top-1 right-0 bg-blue-500 text-white text-xs px-2 py-1 rounded-bl z-10">
                    진행중
                  </span>
                </>
              )}

              {isNext && (
                <>
                  <span className="absolute top-1 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded-bl z-10">
                    다음 일정
                  </span>
                  <span className="absolute top-7 right-0 bg-yellow-400 text-white text-xs px-2 py-1 rounded-bl z-10">
                    {dDayLabel}
                  </span>
                </>
              )}

              {/* 타입 뱃지 + 날짜 */}
              <div className="flex items-center">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded mr-2
                    ${
                      schedule.type === "personal"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }
                  `}
                >
                  {schedule.type === "personal" ? "개인" : "그룹"}
                </span>
                <div className="text-sm text-gray-500">{formatScheduleDate(schedule)}</div>
              </div>

              {/* 제목 */}
              <div className="text-lg font-bold mt-1 truncate" title={schedule.title}>
                {schedule.title}
              </div>

              {/* 장소 + 아이콘 */}
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
};

export default ScheduleListView;
