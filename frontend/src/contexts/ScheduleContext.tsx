// /frontend/src/contexts/ScheduleContext.tsx

import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSocket } from "../contexts/SocketContext";
import scheduleService from "../services/scheduleService";

// 수정된 일정 타입 정의: owner_uuid, group_uuid, created_at, updated_at 제거
export interface Schedule {
  uuid: string;
  title: string;
  description?: string;
  location?: string;
  start_time: Date;
  end_time: Date;
  type: "personal" | "group";
  allDay: boolean; // 모든 일정은 종일(all-day) 이벤트로 처리됨
}

interface ScheduleContextType {
  schedules: Schedule[];
  // 프론트엔드에서는 불필요한 필드는 보내지 않음
  createSchedule: (newSchedule: Omit<Schedule, "uuid" | "allDay">) => void;
  updateSchedule: (uuid: string, updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>) => void;
  deleteSchedule: (uuid: string) => void;
  // 백엔드 API를 통하여 최신 일정을 불러오는 함수
  refreshSchedules: () => Promise<void>;
}

const ScheduleContext = createContext<ScheduleContextType | undefined>(undefined);

interface ScheduleProviderProps {
  children: ReactNode;
}

export const ScheduleProvider: React.FC<ScheduleProviderProps> = ({ children }) => {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const { socket } = useSocket();

  // 클라이언트에서 생성한 일정은 uuid만 임의로 생성하며 나머지 필드는 API 전송 시 백엔드에서 처리하도록 함
  const createSchedule = (newSchedule: Omit<Schedule, "uuid" | "allDay">) => {
    const schedule: Schedule = {
      ...newSchedule,
      uuid: uuidv4(),
      allDay: true, // UI 상에서 종일(all-day) 이벤트임을 명시
    };
    setSchedules((prev) => [...prev, schedule]);
  };

  const updateSchedule = (
    uuid: string,
    updatedData: Partial<Omit<Schedule, "uuid" | "allDay">>,
  ) => {
    setSchedules((prev) =>
      prev.map((schedule) => (schedule.uuid === uuid ? { ...schedule, ...updatedData } : schedule)),
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
      // 각 항목의 start_time, end_time (문자열)을 Date 객체로 변환하고 allDay 플래그 추가
      const parsed = data.map((item) => ({
        ...item,
        start_time: new Date(item.start_time),
        end_time: new Date(item.end_time),
        allDay: true,
      }));
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
        if (existing) {
          return prev.map((sch) => (sch.uuid === data.uuid ? { ...sch, ...data } : sch));
        } else {
          const newSchedule: Schedule = { ...data, uuid: data.uuid, allDay: true } as Schedule;
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
