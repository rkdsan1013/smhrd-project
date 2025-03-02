import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
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
        {isLoggedIn && <Header />}
        <div className="container">
          {isLoggedIn ? (
            <>
              <Sidebar isLoggedIn={isLoggedIn} onSignin={handleLogin} />
              <Content />
            </>
          ) : (
            <div className="auth-container">
              <AuthForm onSignin={handleLogin} />
            </div>
          )}
        </div>
        {isLoggedIn && <Footer />}
      </div>
    </UserProvider>
  );
};

export default App;
