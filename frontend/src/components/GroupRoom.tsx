// /frontend/src/components/GroupRoom.tsx

import React from "react";

interface GroupRoomProps {
  groupUuid: string;
}

const GroupRoom: React.FC<GroupRoomProps> = ({ groupUuid }) => {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">그룹 방</h1>
      <p>선택된 그룹 UUID: {groupUuid}</p>
    </div>
  );
};

export default GroupRoom;
