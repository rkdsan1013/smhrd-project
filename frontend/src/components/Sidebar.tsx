import React from 'react';
import LoginForm from './LoginForm';
import { useUser } from '../contexts/UserContext';
import './Sidebar.css';

interface SidebarProps {
  isLoggedIn: boolean;
  onLogin: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isLoggedIn, onLogin }) => {
    const { username } = useUser();
    return (
    <aside className="sidebar">
      {!isLoggedIn ? (
        <LoginForm onLogin={onLogin} />
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
