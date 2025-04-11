// /frontend/src/components/Calendar.tsx

import React, { useState, useMemo, useEffect } from "react";
import { Calendar as RBCalendar, momentLocalizer, View, SlotInfo } from "react-big-calendar";
import moment from "moment";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import "moment/locale/ko";
import "react-big-calendar/lib/css/react-big-calendar.css";
import Icons from "./Icons";
import ScheduleAllDayModal from "./ScheduleAllDayModal";
import ScheduleDetailModal from "./ScheduleDetailModal";
import { motion, AnimatePresence } from "framer-motion";
import { useSchedule, Schedule } from "../contexts/ScheduleContext";
// import ScheduleService from "../services/ScheduleService"; // 제거: 사용되지 않음

// 애니메이션 설정
const motionVariants = {
  initial: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

moment.locale("ko");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

// 허용되는 뷰 목록 및 라벨
const allowedViewKeys: Array<"month" | "week" | "day" | "agenda"> = [
  "month",
  "week",
  "day",
  "agenda",
];
const viewLabels: Record<"month" | "week" | "day" | "agenda", string> = {
  month: "월별",
  week: "주별",
  day: "일별",
  agenda: "일정",
};

// react-big-calendar 메시지 객체
const messages: any = {
  allDay: "종일",
  date: "날짜",
  time: "시간",
  event: "일정",
  month: "월별",
  week: "주별",
  day: "일별",
  agenda: "일정",
  noEventsInRange: "일정이 없습니다.",
  showMore: (total: number) => `+ ${total}개 일정 더 보기...`,
};

// 시간 포맷 헬퍼 함수
const formatKoreanTime = (date: Date, formatStr: string = "A hh:mm") =>
  moment(date).format(formatStr).replace(/AM/g, "오전").replace(/PM/g, "오후");

// react-big-calendar 날짜/시간 포맷 설정 객체
const formats = {
  dateFormat: "D",
  dayFormat: "D일",
  weekdayFormat: (date: Date) => ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
  monthHeaderFormat: "YYYY년 MM월",
  dayHeaderFormat: (date: Date) =>
    `${moment(date).format("YYYY년 MM월 DD일")} (${
      ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    })`,
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${moment(start).format("YYYY.MM.DD")} ~ ${moment(end).format("YYYY.MM.DD")}`,
  agendaDateFormat: (date: Date) => {
    const formatted = moment(date).format("MM/DD");
    const dayAbbr = ["일", "월", "화", "수", "목", "금", "토"][date.getDay()];
    return `${formatted} (${dayAbbr})`;
  },
  agendaTimeFormat: (date: Date) => formatKoreanTime(date),
  agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${formatKoreanTime(start)} - ${formatKoreanTime(end)}`,
  agendaHeaderFormat: () => `날짜       시간       일정`,
  timeGutterFormat: (date: Date) => formatKoreanTime(date),
  slotLabelFormat: (date: Date) => formatKoreanTime(date),
  eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${formatKoreanTime(start)} - ${formatKoreanTime(end)}`,
  selectRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
    `${formatKoreanTime(start)} ~ ${formatKoreanTime(end)}`,
};

export interface CalendarProps {
  initialDate?: Date;
  view?: View | "all";
  mode?: "read" | "edit";
}

const Calendar: React.FC<CalendarProps> = ({ initialDate, view = "all", mode = "read" }) => {
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "agenda">(
    view === "all" ? "month" : (view as "month" | "week" | "day" | "agenda"),
  );
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [filterType, setFilterType] = useState<"all" | "personal" | "group">("all");
  const [showAllDayModal, setShowAllDayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  // useSchedule에서 필요한 함수들만 구조 분해 (createSchedule은 여기서 사용하지 않음)
  const { schedules, updateSchedule, refreshSchedules } = useSchedule();

  const isEditable = mode === "edit";
  const isFixedView = view !== "all";

  // 백엔드로부터 일정 목록을 새로 불러오는 함수
  const updateSchedules = async () => {
    try {
      await refreshSchedules();
    } catch (error) {
      console.error("Error refreshing schedules:", error);
    }
  };

  // 컴포넌트 마운트 시 일정 목록 로드
  useEffect(() => {
    updateSchedules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 날짜 이동 기능
  const shiftDate = (
    date: Date,
    view: "month" | "week" | "day" | "agenda",
    direction: "prev" | "next",
  ): Date => {
    const amount = direction === "prev" ? -1 : 1;
    const unit = view === "month" ? "month" : view === "day" ? "day" : "week";
    return moment(date).add(amount, unit).toDate();
  };

  const handlePrev = () => setCurrentDate(shiftDate(currentDate, currentView, "prev"));
  const handleNext = () => setCurrentDate(shiftDate(currentDate, currentView, "next"));
  const handleToday = () => setCurrentDate(new Date());

  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!isEditable) return;
    setSelectedSlot(slotInfo);
    const isMonthAllDay = currentView === "month";
    const isExplicitAllDay = (slotInfo as any)?.box?.className?.includes("rbc-allday-cell");
    const isAllDayTimeRange =
      moment(slotInfo.start).hour() === 0 &&
      moment(slotInfo.end).hour() === 0 &&
      moment(slotInfo.end).diff(moment(slotInfo.start), "days") >= 1;

    isMonthAllDay || isExplicitAllDay || isAllDayTimeRange
      ? setShowAllDayModal(true)
      : setShowDetailModal(true);
  };

  // react-big-calendar에 넘길 scrollToTime 계산
  const scrollToTime = useMemo(() => {
    const today = moment().startOf("day");
    const todayEvents = schedules.filter((s) => moment(s.start_time).isSame(today, "day"));
    if (todayEvents.length > 0) {
      const earliest = todayEvents.reduce((a, b) => (a.start_time < b.start_time ? a : b));
      return new Date(earliest.start_time);
    }
    return moment(currentDate).set({ hour: 9, minute: 0 }).toDate();
  }, [schedules, currentDate]);

  const filteredEvents = useMemo(
    () => (filterType === "all" ? schedules : schedules.filter((s) => s.type === filterType)),
    [schedules, filterType],
  );

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <header className="bg-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-indigo-500"
            >
              <Icons name="angleLeft" className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="text-xl font-bold px-4 py-1 bg-indigo-700 hover:bg-indigo-500 rounded-full transition duration-300"
            >
              {moment(currentDate).format(
                currentView === "month" ? "YYYY년 MM월" : "YYYY년 MM월 DD일",
              )}
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center transition-colors duration-300 hover:bg-indigo-500"
            >
              <Icons name="angleRight" className="w-5 h-5" />
            </button>
          </div>
          {!isFixedView && (
            <div className="flex gap-2 items-center">
              <div className="hidden md:flex gap-2">
                {allowedViewKeys.map((viewKey) => (
                  <button
                    key={viewKey}
                    onClick={() => setCurrentView(viewKey)}
                    className={`px-4 py-1 rounded-full font-medium transition duration-300 ${
                      viewKey === currentView
                        ? "bg-white text-indigo-600 shadow"
                        : "hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    {viewLabels[viewKey]}
                  </button>
                ))}
              </div>
              <div className="md:hidden">
                <select
                  className="text-indigo-600 bg-white rounded-md py-1 px-2 transition duration-300"
                  value={currentView}
                  onChange={(e) =>
                    setCurrentView(e.target.value as "month" | "week" | "day" | "agenda")
                  }
                >
                  {allowedViewKeys.map((viewKey) => (
                    <option key={viewKey} value={viewKey}>
                      {viewLabels[viewKey]}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2 justify-start">
          {(["all", "personal", "group"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-4 py-1 text-sm rounded-full font-medium transition duration-300 ${
                filterType === type
                  ? "bg-white text-indigo-600 shadow"
                  : "hover:bg-white hover:text-indigo-600"
              }`}
            >
              {type === "all" ? "전체" : type === "personal" ? "개인" : "그룹"}
            </button>
          ))}
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <DndProvider backend={HTML5Backend}>
          <AnimatePresence mode="wait">
            <motion.div key={currentView} {...motionVariants} className="h-full overflow-y-auto">
              <DnDCalendar
                localizer={localizer}
                culture="ko"
                events={filteredEvents}
                startAccessor={(schedule: object) => (schedule as Schedule).start_time}
                endAccessor={(schedule: object) => (schedule as Schedule).end_time}
                view={currentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onView={(v) => !isFixedView && setCurrentView(v as any)}
                views={isFixedView ? [currentView] : allowedViewKeys}
                toolbar={false}
                selectable={isEditable}
                resizable={isEditable}
                scrollToTime={scrollToTime}
                eventPropGetter={(event: object) => {
                  const schedule = event as Schedule;
                  const backgroundColor = schedule.type === "personal" ? "#2563eb" : "#16a34a";
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
                }}
                messages={messages}
                formats={formats}
                onSelectSlot={isEditable ? handleSelectSlot : undefined}
                onEventDrop={
                  isEditable
                    ? ({ event, start, end }: any) =>
                        updateSchedule((event as Schedule).uuid, {
                          start_time: start,
                          end_time: end,
                        })
                    : undefined
                }
                onEventResize={
                  isEditable
                    ? ({ event, start, end }: any) =>
                        updateSchedule((event as Schedule).uuid, {
                          start_time: start,
                          end_time: end,
                        })
                    : undefined
                }
              />
            </motion.div>
          </AnimatePresence>
        </DndProvider>
      </div>
      {isEditable && showAllDayModal && selectedSlot && (
        <ScheduleAllDayModal
          onClose={() => {
            setShowAllDayModal(false);
            updateSchedules();
          }}
          defaultValues={{
            startDate: moment(selectedSlot.start).format("YYYY-MM-DD"),
            endDate: moment(selectedSlot.end).subtract(1, "day").format("YYYY-MM-DD"),
          }}
        />
      )}
      {isEditable && showDetailModal && selectedSlot && (
        <ScheduleDetailModal
          onClose={() => {
            setShowDetailModal(false);
            updateSchedules();
          }}
          defaultValues={{
            detailDate: moment(selectedSlot.start).format("YYYY-MM-DD"),
            startTime: moment(selectedSlot.start).format("HH:mm"),
            endTime: moment(selectedSlot.end).format("HH:mm"),
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
