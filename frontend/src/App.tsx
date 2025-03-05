// /src/App.tsx
import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Content from './components/Content';
import Footer from './components/Footer';
import AuthForm from './components/AuthForm';
import { UserProvider } from './contexts/UserContext';
import './App.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    const onUserSignedIn = () => setIsAuthenticated(true);
    window.addEventListener('userSignedIn', onUserSignedIn);
    return () => window.removeEventListener('userSignedIn', onUserSignedIn);
  }, []);

  return (
    <UserProvider>
      <div className="app">
        {isAuthenticated && <Header />}
        <div className="container">
          {isAuthenticated ? (
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
        {isAuthenticated && <Footer />}
      </div>
    </UserProvider>
  );
};

export default App;
