// Sidebar.tsx

import React from 'react';
import AuthForm from './AuthForm';
import { useUser } from '../contexts/UserContext';
import './Sidebar.css';

interface SidebarProps {
  isSignedIn: boolean;
  onSignin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isSignedIn, onSignin }) => {
  const { username } = useUser();
  return (
    <aside className="sidebar">
      {!isSignedIn ? (
        <AuthForm onSignin={onSignin} />
      ) : (
        <div>
          <h2>{username && <p>Welcome, {username}!</p>}</h2>
          {/* 마이페이지 내용 추가 */}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
