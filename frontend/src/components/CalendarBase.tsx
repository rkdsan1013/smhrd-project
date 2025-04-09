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
import Icons from "./Icons";

// Framer Motion 관련 import 및 수정된 motionVariants (전환 duration: 300ms)
import { motion, AnimatePresence } from "framer-motion";

const motionVariants = {
  initial: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

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

/*
  CustomHeader:
  오늘 날짜일 경우 동그라미 대신 단순히 텍스트 색상만 변경하여 강조.
  isWeekView prop는 받아오지만 사용하지 않으므로 _isWeekView로 처리하여 경고를 피함.
*/
const CustomHeader: React.FC<CustomHeaderProps> = ({
  date,
  label,
  isWeekView: _isWeekView = false,
}) => {
  const isToday = moment(date).isSame(new Date(), "day");
  const textClass = isToday ? "text-indigo-500" : "text-gray-700";
  return (
    <div className={`text-center font-bold ${textClass}`}>{label || moment(date).format("D")}</div>
  );
};

export interface CalendarBaseProps {
  initialDate?: Date;
  /**
   * onlyView가 지정되면 해당 뷰로 고정되고 뷰 전환 버튼은 숨김
   * 예: "month", "week", "day", "agenda"
   */
  onlyView?: View;
}

const CalendarBase: React.FC<CalendarBaseProps> = ({ initialDate, onlyView }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
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

  // 이전/다음 버튼: focus:ring 제거, Tailwind 유틸리티 클래스로 스타일 적용
  const iconButtonClass =
    "flex items-center justify-center w-10 h-10 bg-indigo-600 text-white rounded-full shadow hover:bg-indigo-500 transition duration-300 focus:outline-none";

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
        opacity: 0.9,
        color: "white",
        border: "none",
        display: "block",
      },
    };
  };

  // scrollToTime 로직은 그대로 두되, 여기서는 key로 currentView를 사용합니다.
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
    <div className="w-full h-full flex flex-col bg-gray-50">
      {/* 헤더 영역 */}
      <header className="bg-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="flex w-full items-center justify-between">
          {/* 좌측 영역: 이전 버튼, 날짜 텍스트 (클릭 시 오늘 이동), 다음 버튼 */}
          <div className="flex items-center space-x-2">
            <button onClick={handlePrev} className={iconButtonClass}>
              <Icons name="angleLeft" className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={handleToday}
              className="text-xl font-extrabold cursor-pointer px-3 py-1 rounded-full hover:bg-indigo-500 transition duration-300"
            >
              {["month", "week"].includes(currentView)
                ? moment(currentDate).format("YYYY년 MM월")
                : moment(currentDate).format("YYYY년 MM월 DD일")}
            </button>
            <button onClick={handleNext} className={iconButtonClass}>
              <Icons name="angleRight" className="w-5 h-5 text-white" />
            </button>
          </div>
          {/* 우측 영역 */}
          <div className="flex items-center">
            {/* 데스크탑 (md 이상): 보기 전환 버튼 그룹, space-x-2 적용 */}
            <div className="hidden md:flex items-center space-x-2">
              {!onlyView && (
                <>
                  <button
                    onClick={() => setCurrentView("month")}
                    className={`px-4 py-1 rounded-full transition duration-300 font-medium ${
                      currentView === "month"
                        ? "bg-white text-indigo-600 shadow"
                        : "bg-transparent text-white hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    월별
                  </button>
                  <button
                    onClick={() => setCurrentView("week")}
                    className={`px-4 py-1 rounded-full transition duration-300 font-medium ${
                      currentView === "week"
                        ? "bg-white text-indigo-600 shadow"
                        : "bg-transparent text-white hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    주별
                  </button>
                  <button
                    onClick={() => setCurrentView("day")}
                    className={`px-4 py-1 rounded-full transition duration-300 font-medium ${
                      currentView === "day"
                        ? "bg-white text-indigo-600 shadow"
                        : "bg-transparent text-white hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    일별
                  </button>
                  <button
                    onClick={() => setCurrentView("agenda")}
                    className={`px-4 py-1 rounded-full transition duration-300 font-medium ${
                      currentView === "agenda"
                        ? "bg-white text-indigo-600 shadow"
                        : "bg-transparent text-white hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    일정
                  </button>
                </>
              )}
            </div>
            {/* 모바일 (md 미만): 원래 스타일의 드롭다운 */}
            <div className="flex md:hidden items-center">
              <select
                className="bg-white text-indigo-600 rounded-full shadow px-3 py-1 focus:outline-none"
                value={currentView}
                onChange={(e) => setCurrentView(e.target.value as View)}
              >
                <option value="month">월별</option>
                <option value="week">주별</option>
                <option value="day">일별</option>
                <option value="agenda">일정</option>
              </select>
            </div>
          </div>
        </div>
      </header>
      {/* 캘린더 컨텐츠 영역 (패딩 제거 및 스크롤 숨김) */}
      <div className="flex-1 bg-white overflow-hidden relative">
        <div className="relative h-full">
          <DndProvider backend={HTML5Backend}>
            <AnimatePresence mode="wait">
              <motion.div
                key={currentView}
                variants={motionVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="absolute inset-0"
              >
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
              </motion.div>
            </AnimatePresence>
          </DndProvider>
        </div>
      </div>
    </div>
  );
};

export default CalendarBase;
