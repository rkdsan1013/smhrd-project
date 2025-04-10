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
import ScheduleAllDayModal from "./ScheduleAllDayModal";
import ScheduleDetailModal from "./ScheduleDetailModal";
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

const messages: Partial<Record<View, string>> = {
  month: "월별",
  week: "주별",
  day: "일별",
  agenda: "일정",
};

const formats = {
  dateFormat: "D",
  dayFormat: "D일",
  weekdayFormat: (date: Date): string => ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
  monthHeaderFormat: "YYYY년 MM월",
  dayHeaderFormat: (date: Date): string =>
    `${moment(date).format("YYYY년 MM월 DD일")} (${
      ["일", "월", "화", "수", "목", "금", "토"][date.getDay()]
    })`,
  dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }): string =>
    `${moment(start).format("YYYY.MM.DD")} ~ ${moment(end).format("YYYY.MM.DD")}`,
  agendaDateFormat: "MM/DD (dd)",
  agendaTimeFormat: "HH:mm",
  timeGutterFormat: "HH:mm",
};

export interface CalendarBaseProps {
  initialDate?: Date;
  onlyView?: View;
}

const CalendarBase: React.FC<CalendarBaseProps> = ({ initialDate, onlyView }) => {
  const [currentDate, setCurrentDate] = useState(initialDate || new Date());
  const [currentView, setCurrentView] = useState<View>(onlyView || "month");
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [showAllDayModal, setShowAllDayModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);

  const shiftDate = (date: Date, view: View, direction: "prev" | "next"): Date => {
    const amount = direction === "prev" ? -1 : 1;
    return moment(date)
      .add(amount, view === "month" ? "month" : view === "day" ? "day" : "week")
      .toDate();
  };

  const handlePrev = () => setCurrentDate(shiftDate(currentDate, currentView, "prev"));
  const handleNext = () => setCurrentDate(shiftDate(currentDate, currentView, "next"));
  const handleToday = () => setCurrentDate(new Date());

  const handleSelectSlot = (slotInfo: SlotInfo) => {
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

  const updateEvent = (uuid: string, start: Date, end: Date) => {
    setEvents((prev) => prev.map((e) => (e.uuid === uuid ? { ...e, start, end } : e)));
  };

  const handleEventDrop = ({ event, start, end }: any) => updateEvent(event.uuid, start, end);
  const handleEventResize = ({ event, start, end }: any) => updateEvent(event.uuid, start, end);

  const eventStyleGetter = (event: object): { style: React.CSSProperties } => {
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

  const scrollToTime = useMemo(() => {
    const today = moment().startOf("day");
    const todayEvents = events.filter((e) => moment(e.start).isSame(today, "day"));
    if (todayEvents.length > 0) {
      const earliest = todayEvents.reduce((a, b) => (a.start < b.start ? a : b));
      return new Date(earliest.start);
    }
    return moment(currentDate).set({ hour: 9, minute: 0 }).toDate();
  }, [events, currentView, currentDate]);

  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <header className="bg-indigo-600 text-white px-6 py-4 shadow-lg">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              className="w-10 h-10 bg-indigo-600 rounded-full shadow text-white flex items-center justify-center transition-colors duration-300 hover:bg-indigo-500"
            >
              <Icons name="angleLeft" className="w-5 h-5" />
            </button>
            <button
              onClick={handleToday}
              className="text-xl font-bold px-4 py-1 hover:bg-indigo-500 rounded-full"
            >
              {moment(currentDate).format(
                currentView === "month" ? "YYYY년 MM월" : "YYYY년 MM월 DD일",
              )}
            </button>
            <button
              onClick={handleNext}
              className="w-10 h-10 bg-indigo-600 rounded-full shadow text-white flex items-center justify-center transition-colors duration-300 hover:bg-indigo-500"
            >
              <Icons name="angleRight" className="w-5 h-5" />
            </button>
          </div>

          {!onlyView && (
            <div className="flex gap-2 items-center">
              <div className="hidden md:flex gap-2">
                {(Object.keys(messages) as View[]).map((view) => (
                  <button
                    key={view}
                    onClick={() => setCurrentView(view)}
                    className={`px-4 py-1 rounded-full font-medium transition ${
                      view === currentView
                        ? "bg-white text-indigo-600 shadow"
                        : "hover:bg-white hover:text-indigo-600"
                    }`}
                  >
                    {messages[view] ?? view}
                  </button>
                ))}
              </div>
              <div className="md:hidden">
                <select
                  className="text-indigo-600 bg-white rounded-md py-1 px-2"
                  value={currentView}
                  onChange={(e) => setCurrentView(e.target.value as View)}
                >
                  {(Object.keys(messages) as View[]).map((view) => (
                    <option key={view} value={view}>
                      {messages[view] ?? view}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        <DndProvider backend={HTML5Backend}>
          <AnimatePresence mode="wait">
            <motion.div key={currentView} {...motionVariants} className="h-full overflow-y-auto">
              <DnDCalendar
                localizer={localizer}
                events={events}
                startAccessor={(event: object) => (event as CalendarEvent).start}
                endAccessor={(event: object) => (event as CalendarEvent).end}
                view={currentView}
                date={currentDate}
                onNavigate={setCurrentDate}
                onView={(v) => !onlyView && setCurrentView(v)}
                views={onlyView ? [onlyView] : (Object.keys(messages) as View[])}
                toolbar={false}
                selectable
                resizable
                scrollToTime={scrollToTime}
                eventPropGetter={eventStyleGetter}
                messages={messages}
                formats={formats}
                onSelectSlot={handleSelectSlot}
                onEventDrop={handleEventDrop}
                onEventResize={handleEventResize}
              />
            </motion.div>
          </AnimatePresence>
        </DndProvider>
      </div>

      {showAllDayModal && selectedSlot && (
        <ScheduleAllDayModal
          onClose={() => setShowAllDayModal(false)}
          onSubmit={(data) => {
            setEvents((prev) => [
              ...prev,
              {
                uuid: uuidv4(),
                title: data.title,
                start: new Date(data.startDate),
                end: moment(data.endDate).add(1, "day").toDate(),
                type: "personal",
                description: data.description,
                location: data.location,
              },
            ]);
          }}
          defaultValues={{
            startDate: moment(selectedSlot.start).format("YYYY-MM-DD"),
            endDate: moment(selectedSlot.end).subtract(1, "day").format("YYYY-MM-DD"),
          }}
        />
      )}

      {showDetailModal && selectedSlot && (
        <ScheduleDetailModal
          onClose={() => setShowDetailModal(false)}
          onSubmit={(data) => {
            const start = new Date(`${data.detailDate}T${data.startTime}`);
            const end = new Date(`${data.detailDate}T${data.endTime}`);
            setEvents((prev) => [
              ...prev,
              {
                uuid: uuidv4(),
                title: data.title,
                start,
                end,
                type: "personal",
                description: data.description,
                location: data.location,
              },
            ]);
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

export default CalendarBase;
