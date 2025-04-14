// /components/DestinationMap.tsx

import React from "react";
import NaverMap from "./NaverMap"; // 기존 컴포넌트 그대로 사용

interface Props {
  address: string;
}

const DestinationMap: React.FC<Props> = ({ address }) => {
  return (
    <div className="w-full mt-2">
      {/* ✅ 지도 렌더링 */}
      <NaverMap address={address} />
    </div>
  );
};

export default DestinationMap;
