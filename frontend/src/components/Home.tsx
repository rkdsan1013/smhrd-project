// /frontend/src/components/Home.tsx

import React, { useMemo } from "react";
import Calendar from "./Calendar";
import PopularDestinations from "./PopularTravelDestinations";
import { useSchedule } from "../contexts/ScheduleContext";
import moment from "moment";
import Icons from "./Icons";

const Home: React.FC = () => {
  const { schedules } = useSchedule();
  const now = Date.now();

  // 현재 진행 중인 일정: 현재 시각이 일정의 시작 및 종료 사이인 경우
  const currentSchedules = useMemo(() => {
    return schedules
      .filter((schedule) => {
        const start = new Date(schedule.start_time).getTime();
        const end = new Date(schedule.end_time).getTime();
        return now >= start && now <= end;
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [schedules, now]);

  // 다음 일정: 현재 시각 이후인 allDay 일정 중 가장 빠른 일정 선택
  const nextSchedule = useMemo(() => {
    const upcomingAllDay = schedules.filter((schedule) => {
      const start = new Date(schedule.start_time).getTime();
      return schedule.allDay && start > now;
    });
    upcomingAllDay.sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
    );
    return upcomingAllDay[0] || null;
  }, [schedules, now]);

  const formatScheduleDate = (schedule: any): string => {
    if (schedule.allDay) {
      const startDate = moment(schedule.start_time);
      // all-day 일정은 종료일에서 하루를 빼서 표시
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

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-y-auto no-scrollbar min-h-[32rem]">
      {/* 캘린더 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow flex flex-col min-h-[32rem] overflow-hidden">
        <div className="flex-1 bg-gray-100 rounded-lg w-full h-full">
          <Calendar mode="read" view="month" />
        </div>
      </div>

      {/* 대시보드 영역 */}
      <div className="flex-1 bg-white rounded-lg shadow p-4 flex flex-row min-h-[25rem] lg:min-h-[25rem] lg:h-full gap-4">
        {/* 왼쪽: 현재 일정 / 다음 일정 */}
        <div className="flex flex-col flex-1 gap-4">
          {/* 현재 일정 */}
          <div className="bg-gray-50 rounded flex flex-col p-4 flex-1 overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-bold mb-2">현재 일정</h2>
            {currentSchedules.length > 0 ? (
              currentSchedules.map((schedule: any) => (
                <div key={schedule.uuid} className="mb-4 p-2 border-b last:border-0">
                  <div className="flex items-center mb-1">
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded mr-2 ${
                        schedule.type === "personal"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {schedule.type === "personal" ? "개인" : "그룹"}
                    </span>
                    {schedule.allDay ? (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-bl">
                        현재 일정
                      </span>
                    ) : (
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-bl">
                        진행중
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">{formatScheduleDate(schedule)}</div>
                  <div className="text-lg font-bold truncate" title={schedule.title}>
                    {schedule.title}
                  </div>
                  {schedule.location && (
                    <div
                      className="text-gray-700 mt-1 flex items-center gap-1 truncate"
                      title={schedule.location}
                    >
                      <Icons name="mapPinAlt" className="w-4 h-4 text-gray-500" />
                      <span>{schedule.location}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-gray-500">현재 진행 중인 일정이 없습니다.</div>
            )}
          </div>

          {/* 다음 일정 */}
          <div className="bg-gray-50 rounded flex flex-col p-4 flex-1 overflow-y-auto no-scrollbar">
            <h2 className="text-xl font-bold mb-2">다음 일정</h2>
            {nextSchedule ? (
              <div className="p-2">
                <div className="flex items-center mb-1">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded mr-2 ${
                      nextSchedule.type === "personal"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-green-100 text-green-600"
                    }`}
                  >
                    {nextSchedule.type === "personal" ? "개인" : "그룹"}
                  </span>
                  <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-bl">
                    다음 일정
                  </span>
                </div>
                <div className="text-sm text-gray-500">{formatScheduleDate(nextSchedule)}</div>
                <div className="text-lg font-bold truncate" title={nextSchedule.title}>
                  {nextSchedule.title}
                </div>
                {nextSchedule.location && (
                  <div
                    className="text-gray-700 mt-1 flex items-center gap-1 truncate"
                    title={nextSchedule.location}
                  >
                    <Icons name="mapPinAlt" className="w-4 h-4 text-gray-500" />
                    <span>{nextSchedule.location}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">다음 일정이 없습니다.</div>
            )}
          </div>
        </div>

        {/* 오른쪽: 여행지 + 지도 컴포넌트 */}
        <div className="bg-gray-50 rounded flex items-center justify-center flex-1">
          <PopularDestinations />
        </div>
      </div>
    </div>
  );
};

export default Home;
