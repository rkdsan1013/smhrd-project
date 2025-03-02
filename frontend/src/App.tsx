import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import { UserProvider } from './contexts/UserContext';
import './App.css';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  return (
    <UserProvider>
      <div className="app">
        <Header />
        <div className="container">
          <Sidebar isLoggedIn={isLoggedIn} onSignin={handleLogin} />
          <Content />
        </div>
        <Footer />
      </div>
    </UserProvider>
  );
};

export default App;
