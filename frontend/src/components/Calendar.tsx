// /frontend/src/components/Calendar.tsx

import React, { useState, useMemo, useEffect, useRef } from "react";
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
import ScheduleEditModal from "./ScheduleEditModal";
import ScheduleDetailEditModal from "./ScheduleDetailEditModal";
import ScheduleListView, { ScheduleListViewHandle } from "./ScheduleListView";
import { motion, AnimatePresence } from "framer-motion";
import { useSchedule, Schedule } from "../contexts/ScheduleContext";

const motionVariants = {
  initial: { opacity: 0, x: 50, transition: { duration: 0.3 } },
  animate: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: -50, transition: { duration: 0.3 } },
};

moment.locale("ko");
const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(RBCalendar);

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
  showMore: (total: number) => `+${total}`,
};

const formatKoreanTime = (date: Date, formatStr: string = "A hh:mm") =>
  moment(date).format(formatStr).replace(/AM/g, "오전").replace(/PM/g, "오후");

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
  mode?: "view" | "edit";
}

const Calendar: React.FC<CalendarProps> = ({ initialDate, view = "all", mode = "view" }) => {
  const isEditable = mode === "edit";
  const [currentView, setCurrentView] = useState<"month" | "week" | "day" | "agenda">(
    view === "all" ? "month" : (view as "month" | "week" | "day" | "agenda"),
  );
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [filterType, setFilterType] = useState<"all" | "personal" | "group">("all");
  const [showAllDayModal, setShowAllDayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailEditModal, setShowDetailEditModal] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  const { schedules, updateSchedule, refreshSchedules } = useSchedule();
  const isFixedView = view !== "all";

  const updateSchedulesAsync = async () => {
    try {
      await refreshSchedules();
    } catch (error) {
      console.error("Error refreshing schedules:", error);
    }
  };

  useEffect(() => {
    updateSchedulesAsync();
  }, []);

  const shiftDate = (
    date: Date,
    view: "month" | "week" | "day" | "agenda",
    direction: "prev" | "next",
  ): Date => {
    const amount = direction === "prev" ? -1 : 1;
    const unit = view === "month" ? "month" : view === "day" ? "day" : "week";
    return moment(date).add(amount, unit).toDate();
  };

  const scheduleListViewRef = useRef<ScheduleListViewHandle>(null);

  const handlePrev = () => {
    if (currentView === "agenda") {
      scheduleListViewRef.current?.scrollPrev();
    } else {
      setCurrentDate(shiftDate(currentDate, currentView, "prev"));
    }
  };

  const handleNext = () => {
    if (currentView === "agenda") {
      scheduleListViewRef.current?.scrollNext();
    } else {
      setCurrentDate(shiftDate(currentDate, currentView, "next"));
    }
  };

  const handleToday = () => {
    if (currentView === "agenda") {
      scheduleListViewRef.current?.scrollToToday();
    } else {
      setCurrentDate(new Date());
    }
  };

  // 빈 영역 클릭 시 – 신규 일정 생성 모달(종일 또는 상세)을 엽니다.
  const handleSelectSlot = (slotInfo: SlotInfo) => {
    if (!isEditable) return;
    setSelectedSlot(slotInfo);
    const isMonthAllDay = currentView === "month";
    const isExplicitAllDay = (slotInfo as any)?.box?.className?.includes("rbc-allday-cell");
    const isAllDayTimeRange =
      moment(slotInfo.start).hour() === 0 &&
      moment(slotInfo.end).hour() === 0 &&
      moment(slotInfo.end).diff(moment(slotInfo.start), "days") >= 1;
    if (isMonthAllDay || isExplicitAllDay || isAllDayTimeRange) {
      setShowAllDayModal(true);
    } else {
      setShowDetailModal(true);
    }
  };

  // 이벤트 클릭 시 – 세부 일정 수정 (비종일 일정은 ScheduleDetailEditModal, 종일 일정은 기존 ScheduleEditModal)
  const handleSelectEvent = (event: object) => {
    if (!isEditable) return;
    const schedule = event as Schedule;
    if (schedule.type === "group") return;
    // 일정의 시작, 종료 시간을 통해 all‑day 여부를 판단합니다.
    const isAllDayEvent =
      moment(schedule.start_time).hour() === 0 &&
      moment(schedule.end_time).hour() === 0 &&
      moment(schedule.end_time).diff(moment(schedule.start_time), "days") >= 1;
    setSelectedSchedule(schedule);
    if (isAllDayEvent) {
      setShowEditModal(true);
    } else {
      setShowDetailEditModal(true);
    }
  };

  // 드래그 & 드롭 및 크기 조절 시, start_time과 end_time 업데이트 (백엔드 업데이트 후 최신 데이터 갱신)
  const handleEventChange = async ({ event, start, end }: any) => {
    const schedule = event as Schedule;
    if (schedule.type === "group") return;
    try {
      await updateSchedule(schedule.uuid, { start_time: start, end_time: end });
    } catch (error) {
      alert("드래그 & 드롭 업데이트에 실패했습니다.");
    }
  };

  const scrollToTime = useMemo(() => {
    if (currentView === "week") {
      const startOfWeek = moment(currentDate).startOf("week");
      const endOfWeek = moment(currentDate).endOf("week");
      const weekEvents = schedules.filter((s) =>
        moment(s.start_time).isBetween(startOfWeek, endOfWeek, undefined, "[]"),
      );
      if (weekEvents.length > 0) {
        const earliest = weekEvents.reduce((a, b) =>
          moment(a.start_time).isBefore(moment(b.start_time)) ? a : b,
        );
        return new Date(earliest.start_time);
      }
    } else if (currentView === "day") {
      const dayEvents = schedules.filter((s) => moment(s.start_time).isSame(currentDate, "day"));
      if (dayEvents.length > 0) {
        const earliest = dayEvents.reduce((a, b) =>
          moment(a.start_time).isBefore(moment(b.start_time)) ? a : b,
        );
        return new Date(earliest.start_time);
      }
    }
    return moment(currentDate).set({ hour: 9, minute: 0 }).toDate();
  }, [schedules, currentDate, currentView]);

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
              {currentView === "agenda"
                ? moment(new Date()).format("YYYY년 MM월 DD일")
                : moment(currentDate).format(
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
            <motion.div
              key={currentView}
              {...motionVariants}
              className="h-full overflow-y-auto min-w-0"
            >
              {currentView === "agenda" ? (
                <ScheduleListView ref={scheduleListViewRef} filterType={filterType} />
              ) : (
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
                  draggableAccessor={(event: object) =>
                    isEditable && (event as Schedule).type !== "group"
                  }
                  resizableAccessor={(event: object) =>
                    isEditable && (event as Schedule).type !== "group"
                  }
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
                  onSelectEvent={isEditable ? handleSelectEvent : undefined}
                  onEventDrop={
                    isEditable
                      ? async (args: any) => {
                          await handleEventChange(args);
                        }
                      : undefined
                  }
                  onEventResize={
                    isEditable
                      ? async (args: any) => {
                          await handleEventChange(args);
                        }
                      : undefined
                  }
                />
              )}
            </motion.div>
          </AnimatePresence>
        </DndProvider>
      </div>
      {isEditable && showAllDayModal && selectedSlot && (
        <ScheduleAllDayModal
          onClose={() => {
            setShowAllDayModal(false);
            updateSchedulesAsync();
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
            updateSchedulesAsync();
          }}
          defaultValues={{
            detailDate: moment(selectedSlot.start).format("YYYY-MM-DD"),
            startTime: moment(selectedSlot.start).format("HH:mm"),
            endTime: moment(selectedSlot.end).format("HH:mm"),
          }}
        />
      )}
      {isEditable && showEditModal && selectedSchedule && (
        <ScheduleEditModal
          onClose={() => {
            setShowEditModal(false);
            updateSchedulesAsync();
            setSelectedSchedule(null);
          }}
          defaultValues={{
            uuid: selectedSchedule.uuid,
            title: selectedSchedule.title,
            description: selectedSchedule.description || "",
            location: selectedSchedule.location || "",
            startDate: moment(selectedSchedule.start_time).format("YYYY-MM-DD"),
            endDate: moment(selectedSchedule.end_time).subtract(1, "day").format("YYYY-MM-DD"),
          }}
        />
      )}
      {isEditable && showDetailEditModal && selectedSchedule && (
        <ScheduleDetailEditModal
          onClose={() => {
            setShowDetailEditModal(false);
            updateSchedulesAsync();
            setSelectedSchedule(null);
          }}
          defaultValues={{
            uuid: selectedSchedule.uuid,
            description: selectedSchedule.description || "",
            location: selectedSchedule.location || "",
            detailDate: moment(selectedSchedule.start_time).format("YYYY-MM-DD"),
            startTime: moment(selectedSchedule.start_time).format("HH:mm"),
            endTime: moment(selectedSchedule.end_time).format("HH:mm"),
          }}
        />
      )}
    </div>
  );
};

export default Calendar;
