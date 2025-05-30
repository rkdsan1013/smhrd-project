// /frontend/src/contexts/ScheduleContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import moment from "moment";
import { useSocket } from "../contexts/SocketContext";
import scheduleService from "../services/scheduleService";

const isAllDayEvent = (start: Date, end: Date): boolean => {
  const startIsMidnight =
    start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0;
  const endIsMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
  return startIsMidnight && endIsMidnight;
};

export interface Schedule {
  uuid: string;
  title: string;
  description?: string;
  location?: string;
  start_time: Date;
  end_time: Date;
  type: "personal" | "group";
  allDay: boolean;
}

interface ScheduleContextType {
  schedules: Schedule[];
  createSchedule: (newSchedule: Omit<Schedule, "uuid" | "allDay">) => Promise<void>;
  updateSchedule: (
    uuid: string,
    updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>,
  ) => Promise<void>;
  deleteSchedule: (uuid: string) => Promise<void>;
  refreshSchedules: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { socket } = useSocket();

  // _newSchedule 매개변수 이름 앞에 _를 붙여 사용하지 않음을 명시
  const createSchedule = async (_newSchedule: Omit<Schedule, "uuid" | "allDay">) => {
    try {
      // 필요하다면 API 호출을 통해 새 일정을 생성할 수 있습니다.
      await refreshSchedules();
    } catch (error) {
      console.error("일정 생성 실패", error);
      throw error;
    }
  };

  const updateSchedule = async (
    uuid: string,
    updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>,
  ) => {
    try {
      // start_time, end_time은 기존 Schedule 타입에서 제거한 후 문자열로 별도 정의
      type ScheduleUpdatePayload = Partial<
        Omit<Schedule, "uuid" | "allDay" | "start_time" | "end_time">
      > & {
        start_time?: string;
        end_time?: string;
      };
      const payload: ScheduleUpdatePayload = {};

      if (updatedData.start_time) {
        payload.start_time = moment(updatedData.start_time).format("YYYY-MM-DD HH:mm:ss");
      }
      if (updatedData.end_time) {
        payload.end_time = moment(updatedData.end_time).format("YYYY-MM-DD HH:mm:ss");
      }
      if (updatedData.title !== undefined) payload.title = updatedData.title;
      if (updatedData.description !== undefined) payload.description = updatedData.description;
      if (updatedData.location !== undefined) payload.location = updatedData.location;
      if (updatedData.type !== undefined) payload.type = updatedData.type;

      await scheduleService.updateSchedule(uuid, payload as any);
      await refreshSchedules();
    } catch (error) {
      console.error("일정 업데이트 실패", error);
      throw error;
    }
  };

  const deleteSchedule = async (uuid: string) => {
    try {
      await scheduleService.deleteSchedule(uuid);
      await refreshSchedules();
    } catch (error) {
      console.error("일정 삭제 실패", error);
      throw error;
    }
  };

  const refreshSchedules = async (): Promise<void> => {
    try {
      const data = await scheduleService.fetchSchedules();
      const parsed = data.map((item) => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        return {
          ...item,
          start_time: start,
          end_time: end,
          allDay: isAllDayEvent(start, end),
        } as Schedule;
      });
      setSchedules(parsed);
    } catch (error) {
      console.error("Error refreshing schedules:", error);
    }
  };

  useEffect(() => {
    if (!socket) return;
    const handleGroupScheduleUpdate = (data: Partial<Schedule> & { uuid: string }) => {
      setSchedules((prev) => {
        const existing = prev.find((sch) => sch.uuid === data.uuid);
        const start = data.start_time ? new Date(data.start_time as any) : undefined;
        const end = data.end_time ? new Date(data.end_time as any) : undefined;
        if (existing) {
          return prev.map((sch) =>
            sch.uuid === data.uuid
              ? {
                  ...sch,
                  ...data,
                  allDay: start && end ? isAllDayEvent(start, end) : sch.allDay,
                }
              : sch,
          );
        } else {
          const newSchedule: Schedule = {
            ...data,
            uuid: data.uuid,
            start_time: start || new Date(),
            end_time: end || new Date(),
            allDay: start && end ? isAllDayEvent(start, end) : true,
          } as Schedule;
          return [...prev, newSchedule];
        }
      });
    };
    socket.on("groupScheduleUpdate", handleGroupScheduleUpdate);
    return () => {
      socket.off("groupScheduleUpdate", handleGroupScheduleUpdate);
    };
  }, [socket]);

  const contextValue = useMemo(
    () => ({
      schedules,
      createSchedule,
      updateSchedule,
      deleteSchedule,
      refreshSchedules,
    }),
    [schedules],
  );

  return <ScheduleContext.Provider value={contextValue}>{children}</ScheduleContext.Provider>;
};

export const useSchedule = (): ScheduleContextType => {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule은 ScheduleProvider 내부에서 호출되어야 합니다.");
  }
  return context;
};
