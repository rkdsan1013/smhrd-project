// /frontend/src/components/Home.tsx

import React, { useMemo } from "react";
import Calendar from "./Calendar";
import PopularTravelDestinations from "./PopularTravelDestinations";
import { useSchedule } from "../contexts/ScheduleContext";
import moment from "moment";
import Icons from "./Icons";

const Home: React.FC = () => {
  const { schedules } = useSchedule();
  const now = Date.now();

  // 현재 진행 중인 allday 일정 필터링 및 정렬
  const currentSchedules = useMemo(() => {
    return schedules
      .filter((schedule: any) => {
        if (!schedule.allDay) return false;
        const start = new Date(schedule.start_time).getTime();
        const end = new Date(schedule.end_time).getTime();
        return now >= start && now <= end;
      })
      .sort((a: any, b: any) => {
        const aStartDate = moment(a.start_time).format("YYYY-MM-DD");
        const bStartDate = moment(b.start_time).format("YYYY-MM-DD");
        if (aStartDate === bStartDate) {
          return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
        }
        return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
      });
  }, [schedules, now]);

  // 다음 일정: 현재 시각 이후에 시작하는 allday 일정 중 가장 빠른 이벤트
  const nextSchedule = useMemo(() => {
    const upcomingAllDay = schedules.filter((schedule: any) => {
      if (!schedule.allDay) return false;
      const start = new Date(schedule.start_time).getTime();
      return start > now;
    });
    upcomingAllDay.sort((a: any, b: any) => {
      const aStartDate = moment(a.start_time).format("YYYY-MM-DD");
      const bStartDate = moment(b.start_time).format("YYYY-MM-DD");
      if (aStartDate === bStartDate) {
        return new Date(a.end_time).getTime() - new Date(b.end_time).getTime();
      }
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    });
    return upcomingAllDay[0] || null;
  }, [schedules, now]);

  // 일정 날짜 포맷팅 함수
  const formatScheduleDate = (schedule: any): string => {
    if (schedule.allDay) {
      const startDate = moment(schedule.start_time);
      // allday 일정은 종료일에서 하루 빼서 표시
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
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col min-h-[32rem] overflow-hidden">
        <div className="flex-1 bg-gray-100 rounded-lg w-full h-full">
          <Calendar mode="read" view="month" />
        </div>
      </div>

      {/* 대시보드 영역 */}
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-row min-h-[25rem] lg:min-h-[25rem] lg:h-full gap-4">
        {/* 왼쪽: 현재 일정 / 다음 일정 영역 */}
        <div className="flex flex-col flex-1 gap-4 h-full">
          {/* 현재 일정 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
            <div className="sticky top-0 z-10 px-4 py-2 bg-white">
              <h2 className="text-xl font-bold text-gray-900">현재 일정</h2>
              <div className="w-full mt-2 border-b border-gray-300"></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">
              {currentSchedules.length > 0 ? (
                currentSchedules.map((schedule: any) => {
                  const start = new Date(schedule.start_time).getTime();
                  const end = new Date(schedule.end_time).getTime();
                  const totalDuration = end - start;
                  const elapsed = now - start;
                  const progressPercent =
                    totalDuration > 0
                      ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
                      : 0;
                  return (
                    <div
                      key={schedule.uuid}
                      className="bg-white shadow-md rounded-lg p-4 mb-4 relative"
                    >
                      {now >= start && now <= end && (
                        <div className="w-full h-1 bg-gray-200 rounded mb-3">
                          <div
                            className="h-full bg-blue-500 transition-all duration-200 rounded"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      )}
                      {/* 상단 배지 영역 (첫 번째 행) */}
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded ${
                            schedule.type === "personal"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          {schedule.type === "personal" ? "개인" : "그룹"}
                        </span>
                        <span className="bg-blue-500 text-white text-xs font-medium px-2 py-1 rounded">
                          현재 일정
                        </span>
                      </div>
                      {/* 날짜 정보 (두 번째 행) */}
                      <div className="mt-1 text-sm text-gray-500">
                        {formatScheduleDate(schedule)}
                      </div>
                      <div className="mt-3 text-lg font-bold truncate" title={schedule.title}>
                        {schedule.title}
                      </div>
                      {schedule.location && (
                        <div
                          className="mt-2 flex items-center gap-1 text-gray-700"
                          title={schedule.location}
                        >
                          <Icons name="mapPinAlt" className="w-4 h-4" />
                          <span>{schedule.location}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-gray-500">현재 진행 중인 일정이 없습니다.</div>
              )}
            </div>
          </div>

          {/* 다음 일정 섹션 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
            <div className="sticky top-0 z-10 px-4 py-2 bg-white">
              <h2 className="text-xl font-bold text-gray-900">다음 일정</h2>
              <div className="w-full mt-2 border-b border-gray-300"></div>
            </div>
            <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-2">
              {nextSchedule ? (
                <div className="bg-white shadow-md rounded-lg p-4 mb-4 relative">
                  {/* 상단 배지 영역 (첫 번째 행) */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        nextSchedule.type === "personal"
                          ? "bg-blue-100 text-blue-600"
                          : "bg-green-100 text-green-600"
                      }`}
                    >
                      {nextSchedule.type === "personal" ? "개인" : "그룹"}
                    </span>
                    <span className="bg-green-500 text-white text-xs font-medium px-2 py-1 rounded">
                      다음 일정
                    </span>
                  </div>
                  {/* 날짜 및 D-Day 정보 (두 번째 행) */}
                  <div className="mt-1 flex items-center">
                    <span className="text-sm text-gray-500">
                      {formatScheduleDate(nextSchedule)}
                    </span>
                    {(() => {
                      const diff = moment(nextSchedule.start_time)
                        .startOf("day")
                        .diff(moment().startOf("day"), "days");
                      if (diff === 0)
                        return <span className="text-sm text-red-600 ml-2">D-Day</span>;
                      else if (diff > 0)
                        return <span className="text-sm text-red-600 ml-2">D-{diff}</span>;
                      return null;
                    })()}
                  </div>
                  <div className="mt-3 text-lg font-bold truncate" title={nextSchedule.title}>
                    {nextSchedule.title}
                  </div>
                  {nextSchedule.location && (
                    <div
                      className="mt-2 flex items-center gap-1 text-gray-700"
                      title={nextSchedule.location}
                    >
                      <Icons name="mapPinAlt" className="w-4 h-4" />
                      <span>{nextSchedule.location}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">다음 일정이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 여행지 + 지도 컴포넌트 */}
        <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-200 flex items-center justify-center flex-1">
          <PopularTravelDestinations />
        </div>
      </div>
    </div>
  );
};

export default Home;
