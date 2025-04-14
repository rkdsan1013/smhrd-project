// /frontend/src/contexts/ScheduleContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../contexts/SocketContext";
import scheduleService from "../services/scheduleService";

// 일정의 allDay 여부를 판단하는 도우미 함수
// 시작 시간과 종료 시간이 모두 자정(00:00:00)인 경우 종일 이벤트로 설정하고,
// 그렇지 않으면 시간 일정으로 판단하여 false를 반환합니다.
const isAllDayEvent = (start: Date, end: Date): boolean => {
  const startIsMidnight =
    start.getHours() === 0 && start.getMinutes() === 0 && start.getSeconds() === 0;
  const endIsMidnight = end.getHours() === 0 && end.getMinutes() === 0 && end.getSeconds() === 0;
  return startIsMidnight && endIsMidnight;
};

// 수정된 일정 타입 정의: owner_uuid, group_uuid, created_at, updated_at 제거
export interface Schedule {
  uuid: string;
  title: string;
  description?: string;
  location?: string;
  start_time: Date;
  end_time: Date;
  type: "personal" | "group";
  allDay: boolean; // 시간 일정이면 false, 종일 일정이면 true
}

interface ScheduleContextType {
  schedules: Schedule[];
  // 프론트엔드에서는 불필요한 필드는 보내지 않음
  createSchedule: (newSchedule: Omit<Schedule, "uuid" | "allDay">) => void;
  updateSchedule: (uuid: string, updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>) => void;
  deleteSchedule: (uuid: string) => void;
  // 백엔드 API를 통해 최신 일정을 불러오는 함수
  refreshSchedules: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { socket } = useSocket();

  // 클라이언트에서 생성한 일정은 uuid만 임의로 생성하며,
  // start_time과 end_time에 따른 allDay 여부를 도우미 함수를 통해 결정함
  const createSchedule = (newSchedule: Omit<Schedule, "uuid" | "allDay">) => {
    const schedule: Schedule = {
      ...newSchedule,
      uuid: uuidv4(),
      allDay: isAllDayEvent(newSchedule.start_time, newSchedule.end_time),
    };
    setSchedules((prev) => [...prev, schedule]);
  };

  const updateSchedule = (
    uuid: string,
    updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>,
  ) => {
    setSchedules((prev) =>
      prev.map((schedule) =>
        schedule.uuid === uuid
          ? {
              ...schedule,
              ...updatedData,
              // 만약 시작/종료 시간이 갱신되면 allDay 여부도 재계산합니다.
              allDay:
                updatedData.start_time && updatedData.end_time
                  ? isAllDayEvent(updatedData.start_time, updatedData.end_time)
                  : schedule.allDay,
            }
          : schedule,
      ),
    );
  };

  const deleteSchedule = (uuid: string) => {
    setSchedules((prev) => prev.filter((schedule) => schedule.uuid !== uuid));
  };

  // 백엔드 API를 통해 최신 일정을 불러옴.
  // scheduleService.fetchSchedules()는 일정 배열을 반환합니다.
  const refreshSchedules = async (): Promise<void> => {
    try {
      const data = await scheduleService.fetchSchedules();
      // 각 항목의 start_time, end_time (문자열)을 Date 객체로 변환하고,
      // 도우미 함수를 통해 allDay 플래그를 결정함
      const parsed = data.map((item) => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        return {
          ...item,
          start_time: start,
          end_time: end,
          allDay: isAllDayEvent(start, end),
        };
      });
      setSchedules(parsed);
    } catch (error) {
      console.error("Error refreshing schedules:", error);
    }
  };

  // Socket 이벤트 구독: 그룹 일정 업데이트 이벤트 반영
  useEffect(() => {
    if (!socket) return;
    const handleGroupScheduleUpdate = (data: Partial<Schedule> & { uuid: string }) => {
      setSchedules((prev) => {
        const existing = prev.find((sch) => sch.uuid === data.uuid);
        // start_time, end_time가 문자열일 경우 Date 객체로 변환
        const start = data.start_time ? new Date(data.start_time) : undefined;
        const end = data.end_time ? new Date(data.end_time) : undefined;
        if (existing) {
          return prev.map((sch) =>
            sch.uuid === data.uuid
              ? {
                  ...sch,
                  ...data,
                  // 둘 다 존재하면 allDay 재계산
                  allDay: start && end ? isAllDayEvent(start, end) : sch.allDay,
                }
              : sch,
          );
        } else {
          // 새로운 일정 수신 시 Date 변환 후 allDay 플래그 설정
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
