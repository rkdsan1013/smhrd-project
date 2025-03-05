// Sidebar.tsx

import React from 'react';
import { useUser } from '../contexts/UserContext';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const { username } = useUser();
  return (
    <aside className="sidebar">
      <div>
        {username && <h2>Welcome, {username}!</h2>}
        {/* 마이페이지 내용 추가 */}
      </div>
    </aside>
  );
};

export default Sidebar;
