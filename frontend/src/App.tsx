// App.tsx

import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import { UserProvider } from './contexts/UserContext';
import './App.css';

const App: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    const handleUserSignedIn = () => {
      setIsSignedIn(true);
    };
    
    window.addEventListener('userSignedIn', handleUserSignedIn);
    
    return () => {
      window.removeEventListener('userSignedIn', handleUserSignedIn);
    };
  }, []);

  return (
    <UserProvider>
      <div className="app">
        {isSignedIn && <Header />}
        <div className="container">
          {isSignedIn ? (
            <>
              <Sidebar />
              <Content />
            </>
          ) : (
            <div className="auth-container">
              <AuthForm />
            </div>
          )}
        </div>
        {isSignedIn && <Footer />}
      </div>
    </UserProvider>
  );
};

export default App;
