// /frontend/src/components/Calendar.tsx

import React, { useState, useMemo } from "react";
import { Calendar as RBCalendar, momentLocalizer, View } from "react-big-calendar";
import moment from "moment";
import "moment/locale/ko";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("ko");

interface CalendarEvent {
  uuid: string;
  title: string;
  start: Date;
  end: Date;
  type: "personal" | "group"; // 개인 일정 vs 그룹 일정
  description?: string;
  location?: string;
}

const messages = {
  allDay: "종일",
  previous: "이전",
  next: "다음",
  today: "오늘",
  month: "월별",
  week: "주별",
  day: "일별",
  agenda: "일정",
  date: "날짜",
  time: "시간",
  event: "이벤트",
  noEventsInRange: "표시할 일정이 없습니다.",
  showMore: (total: number) => `+ ${total}개 추가`,
};

const koreanWeekdays = ["일", "월", "화", "수", "목", "금", "토"];

const formats = {
  dateFormat: "D",
  dayFormat: "D일",
  weekdayFormat: (date: Date): string => koreanWeekdays[date.getDay()],
  monthHeaderFormat: "YYYY년 MM월",
  dayHeaderFormat: (date: Date): string =>
    `${moment(date).format("YYYY년 MM월 DD일")} ${koreanWeekdays[date.getDay()]}`,
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }): string =>
    `${moment(start).format("YYYY년 MM월 DD일")} - ${moment(end).format("YYYY년 MM월 DD일")}`,
  agendaDateFormat: "YYYY년 MM월 DD일",
  agendaTimeFormat: "HH:mm",
  timeGutterFormat: "HH:mm",
};

const Calendar: React.FC = () => {
  const [events] = useState<CalendarEvent[]>([
    {
      uuid: "1",
      title: "개인 일정 예제",
      start: new Date(),
      end: new Date(new Date().getTime() + 60 * 60 * 1000),
      type: "personal",
    },
    {
      uuid: "2",
      title: "그룹 일정 예제",
      start: new Date(new Date().setHours(new Date().getHours() + 2)),
      end: new Date(new Date().setHours(new Date().getHours() + 3)),
      type: "group",
    },
  ]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentView, setCurrentView] = useState<View>("month");

  const handlePrev = () => {
    if (currentView === "month") {
      setCurrentDate((prev) => moment(prev).subtract(1, "month").toDate());
    } else if (currentView === "week" || currentView === "agenda") {
      setCurrentDate((prev) => moment(prev).subtract(1, "week").toDate());
    } else if (currentView === "day") {
      setCurrentDate((prev) => moment(prev).subtract(1, "day").toDate());
    }
  };

  const handleNext = () => {
    if (currentView === "month") {
      setCurrentDate((prev) => moment(prev).add(1, "month").toDate());
    } else if (currentView === "week" || currentView === "agenda") {
      setCurrentDate((prev) => moment(prev).add(1, "week").toDate());
    } else if (currentView === "day") {
      setCurrentDate((prev) => moment(prev).add(1, "day").toDate());
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const eventStyleGetter = (
    event: CalendarEvent,
    _start: Date,
    _end: Date,
    _isSelected: boolean,
  ) => {
    const backgroundColor = event.type === "personal" ? "#2563eb" : "#16a34a";
    return {
      style: {
        backgroundColor,
        borderRadius: "0.375rem",
        opacity: 0.85,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  // 주간, 또는 일간 뷰일 때 해당 기간의 가장 빠른 이벤트의 시작시간으로 스크롤 처리
  const scrollToTime = useMemo(() => {
    if (currentView === "week" || currentView === "day") {
      const start =
        currentView === "week"
          ? moment(currentDate).startOf("week")
          : moment(currentDate).startOf("day");
      const end =
        currentView === "week"
          ? moment(currentDate).endOf("week")
          : moment(currentDate).endOf("day");

      const filteredEvents = events.filter((event) =>
        moment(event.start).isBetween(start, end, null, "[]"),
      );
      if (filteredEvents.length > 0) {
        const earliestEvent = filteredEvents.reduce((prev, curr) =>
          moment(curr.start).isBefore(moment(prev.start)) ? curr : prev,
        );
        return new Date(earliestEvent.start);
      }
    }
    // 이벤트가 없거나 주/일간 뷰 외에는 오전 9시 기본값 사용
    const defaultTime = new Date(currentDate);
    defaultTime.setHours(9, 0, 0, 0);
    return defaultTime;
  }, [currentView, currentDate, events]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md">
      {/* 헤더: 제목 및 날짜 내비게이션 버튼 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <h2 className="text-2xl font-bold">캘린더</h2>
        <div className="flex space-x-2">
          <button
            onClick={handlePrev}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            이전
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            오늘
          </button>
          <button
            onClick={handleNext}
            className="px-3 py-1 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors"
          >
            다음
          </button>
        </div>
      </header>

      {/* 뷰 전환 버튼 */}
      <div className="flex justify-center space-x-2 px-4 py-2 border-b border-gray-200">
        <button
          onClick={() => setCurrentView("month")}
          className={`px-4 py-1 rounded-md transition-colors ${
            currentView === "month"
              ? "bg-blue-500 text-white"
              : "bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          월별
        </button>
        <button
          onClick={() => setCurrentView("week")}
          className={`px-4 py-1 rounded-md transition-colors ${
            currentView === "week"
              ? "bg-blue-500 text-white"
              : "bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          주별
        </button>
        <button
          onClick={() => setCurrentView("day")}
          className={`px-4 py-1 rounded-md transition-colors ${
            currentView === "day"
              ? "bg-blue-500 text-white"
              : "bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          일별
        </button>
        <button
          onClick={() => setCurrentView("agenda")}
          className={`px-4 py-1 rounded-md transition-colors ${
            currentView === "agenda"
              ? "bg-blue-500 text-white"
              : "bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
          }`}
        >
          일정
        </button>
      </div>

      {/* 캘린더 컨텐츠 영역 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <RBCalendar
          localizer={momentLocalizer(moment)}
          events={events}
          startAccessor="start"
          endAccessor="end"
          date={currentDate}
          view={currentView}
          onNavigate={(date, _view, _action) => setCurrentDate(date)}
          onView={(view) => setCurrentView(view as View)}
          views={["month", "week", "day", "agenda"]}
          defaultDate={new Date()}
          toolbar={false}
          style={{ height: "100%" }}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          formats={formats}
          className="text-gray-700"
          scrollToTime={["week", "day"].includes(currentView) ? scrollToTime : undefined}
          key={["week", "day"].includes(currentView) ? scrollToTime.toISOString() : currentView}
        />
      </div>
    </div>
  );
};

export default Calendar;
