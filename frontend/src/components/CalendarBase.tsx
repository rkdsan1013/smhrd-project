// /frontend/src/components/CalendarBase.tsx

import React, { useState, useMemo } from "react";
import { Calendar as RBCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { v4 as uuidv4 } from "uuid";
import "moment/locale/ko";
import "react-big-calendar/lib/css/react-big-calendar.css";

moment.locale("ko");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

export interface CalendarEvent {
  uuid: string;
  title: string;
  start: Date;
  end: Date;
  type: "personal" | "group";
  description?: string;
  location?: string;
}

interface EventDropArg {
  event: CalendarEvent;
  start: Date;
  end: Date;
  allDay?: boolean;
}

interface EventResizeDone {
  event: CalendarEvent;
  start: Date;
  end: Date;
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

interface CustomHeaderProps {
  date: Date;
  label?: React.ReactNode;
  isWeekView?: boolean;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ date, label, isWeekView = false }) => {
  const isToday = moment(date).isSame(new Date(), "day");
  const baseClasses = "text-center font-bold text-gray-700";

  if (!isWeekView && isToday) {
    return (
      <div className={baseClasses}>
        <div className="w-8 h-8 inline-flex items-center justify-center bg-blue-500 text-white rounded-full mx-auto">
          {label || moment(date).format("D")}
        </div>
      </div>
    );
  }
  return <div className={baseClasses}>{label || moment(date).format("D")}</div>;
};

export interface CalendarBaseProps {
  initialDate?: Date;
  /**
   * onlyView가 지정되면 해당 뷰로 고정되고 뷰 전환 버튼은 숨깁니다.
   * 예: "month", "week", "day", "agenda"
   */
  onlyView?: View;
}

const CalendarBase: React.FC<CalendarBaseProps> = ({ initialDate, onlyView }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  // onlyView가 있으면 초기 뷰 설정 후 변경없이 사용
  const [currentView, setCurrentView] = useState<View>(onlyView || "month");

  const [events, setEvents] = useState<CalendarEvent[]>([
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

  // 날짜 이동 헬퍼 함수
  const shiftDate = (date: Date, view: View, direction: "prev" | "next"): Date => {
    const amount = direction === "prev" ? -1 : 1;
    switch (view) {
      case "month":
        return moment(date).add(amount, "month").toDate();
      case "week":
      case "agenda":
        return moment(date).add(amount, "week").toDate();
      case "day":
        return moment(date).add(amount, "day").toDate();
      default:
        return date;
    }
  };

  const viewButtonClass = (active: boolean) =>
    `px-4 py-1 rounded-md transition-colors ${
      active
        ? "bg-blue-500 text-white"
        : "bg-white border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
    }`;

  const handlePrev = () => setCurrentDate(shiftDate(currentDate, currentView, "prev"));
  const handleNext = () => setCurrentDate(shiftDate(currentDate, currentView, "next"));
  const handleToday = () => setCurrentDate(new Date());

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    const newEvent: CalendarEvent = {
      uuid: uuidv4(),
      title: "새 일정",
      start: slotInfo.start,
      end: slotInfo.end,
      type: "personal",
    };
    setEvents((prev) => [...prev, newEvent]);
  };

  const updateEvent = (uuid: string, start: Date, end: Date) => {
    setEvents((prev) => prev.map((e) => (e.uuid === uuid ? { ...e, start, end } : e)));
  };

  const handleEventDrop = (args: any) => {
    const { event, start, end } = args as EventDropArg;
    updateEvent(event.uuid, start, end);
  };

  const handleEventResize = (args: any) => {
    const { event, start, end } = args as EventResizeDone;
    updateEvent(event.uuid, start, end);
  };

  const eventStyleGetter = (
    event: object,
    _start: Date,
    _end: Date,
    _isSelected: boolean,
  ): { style: React.CSSProperties } => {
    const calendarEvent = event as CalendarEvent;
    const backgroundColor = calendarEvent.type === "personal" ? "#2563eb" : "#16a34a";
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
    const defaultTime = new Date(currentDate);
    defaultTime.setHours(9, 0, 0, 0);
    return defaultTime;
  }, [currentView, currentDate, events]);

  return (
    <div className="w-full h-full flex flex-col bg-white rounded-lg shadow-md">
      {/* 헤더 영역 */}
      <header className="px-4 py-3 border-b border-gray-200">
        <p className="text-2xl font-bold text-center">
          {["month", "week"].includes(currentView)
            ? moment(currentDate).format("YYYY년 MM월")
            : moment(currentDate).format("YYYY년 MM월 DD일")}
        </p>
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between items-center">
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
          {/* onlyView가 없으면 뷰 전환 버튼 표시 */}
          {!onlyView && (
            <div className="mt-2 sm:mt-0 flex space-x-2">
              <button
                onClick={() => setCurrentView("month")}
                className={viewButtonClass(currentView === "month")}
              >
                월별
              </button>
              <button
                onClick={() => setCurrentView("week")}
                className={viewButtonClass(currentView === "week")}
              >
                주별
              </button>
              <button
                onClick={() => setCurrentView("day")}
                className={viewButtonClass(currentView === "day")}
              >
                일별
              </button>
              <button
                onClick={() => setCurrentView("agenda")}
                className={viewButtonClass(currentView === "agenda")}
              >
                일정
              </button>
            </div>
          )}
        </div>
      </header>
      {/* 캘린더 컨텐츠 영역 */}
      <div className="flex-1 p-4 overflow-y-auto">
        <DndProvider backend={HTML5Backend}>
          <DnDCalendar
            localizer={localizer}
            events={events}
            startAccessor={(event: any) => (event as CalendarEvent).start}
            endAccessor={(event: any) => (event as CalendarEvent).end}
            date={currentDate}
            view={currentView}
            onNavigate={(date, _view, _action) => setCurrentDate(date)}
            onView={(view) => {
              if (!onlyView) setCurrentView(view as View);
            }}
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
            selectable
            resizable
            onSelectSlot={handleSelectSlot}
            onEventDrop={handleEventDrop}
            onEventResize={handleEventResize}
            components={{
              month: {
                header: (props: any) => <CustomHeader {...props} isWeekView={false} />,
                dateHeader: (props: any) => <CustomHeader {...props} isWeekView={false} />,
              },
              week: {
                header: (props: any) => <CustomHeader {...props} isWeekView={true} />,
              },
            }}
          />
        </DndProvider>
      </div>
    </div>
  );
};

export default CalendarBase;
