// /src/components/Sidebar.tsx
import React from 'react';
import { useUser } from '../contexts/UserContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { username } = useUser();
  return (
    <aside className="sidebar">
      <div>
        {username && <h2>Welcome, {username}!</h2>}
        {/* 추가적인 마이페이지 혹은 네비게이션 내용 */}
      </div>
    </aside>
  );
};

export default Sidebar;
