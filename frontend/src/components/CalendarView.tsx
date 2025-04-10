// /frontend/src/components/CalendarView.tsx

import React from "react";
import Calendar from "./Calendar";

const CalendarView: React.FC = () => {
  return (
    <div className="w-full h-full">
      <Calendar mode="edit" view="all" />
    </div>
  );
};

export default CalendarView;
