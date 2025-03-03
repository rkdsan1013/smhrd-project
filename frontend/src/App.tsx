// App.tsx

import React, { useState } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import { UserProvider } from './contexts/UserContext';
import './App.css';

const App: React.FC = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);

  const handleSignIn = () => {
    setIsSignedIn(true);
  };

  return (
    <UserProvider>
      <div className="app">
        {isSignedIn && <Header />}
        <div className="container">
          {isSignedIn ? (
            <>
              <Sidebar isSignedIn={isSignedIn} onSignin={handleSignIn} />
              <Content />
            </>
          ) : (
            <div className="auth-container">
              <AuthForm onSignin={handleSignIn} />
            </div>
          )}
        </div>
        {isSignedIn && <Footer />}
      </div>
    </UserProvider>
  );
};

export default App;
