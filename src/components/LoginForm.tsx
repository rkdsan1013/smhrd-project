import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './LoginForm.css';

interface LoginFormProps {
  onLogin: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [step, setStep] = useState<number>(1);
  const { setUsername } = useUser();
  const [inputUsername, setInputUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [formHeight, setFormHeight] = useState<number | string>('auto');

  const usernameRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (usernameRef.current) usernameRef.current.focus();
  }, []);

  useEffect(() => {
    if (step === 1 && usernameRef.current) {
      usernameRef.current.focus();
    } else if (step > 1 && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [step]);

  useLayoutEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        setFormHeight(contentRef.current.scrollHeight);
      }
    };

    updateHeight();
  }, [step, error, inputUsername, password, confirmPassword]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateEmail(inputUsername)) {
        setError('유효한 이메일 주소를 입력하세요.');
        return;
      }

      setError('');
      setStep(inputUsername === 'smhrd123@example.com' ? 2 : 3);
    } else if (step === 2) {
      if (inputUsername === 'smhrd123@example.com' && password === 'smhrd123') {
        onLogin();
        setUsername(inputUsername);
      } else {
        setError('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } else if (step === 3) {
      if (password.length < 8) {
        setError('비밀번호는 최소 8자 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setError('비밀번호가 일치하지 않습니다.');
        return;
      }
      onLogin();
      setUsername(inputUsername);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setPassword('');
    setConfirmPassword('');
    setError('');
    if (usernameRef.current) {
      usernameRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && step > 1) handlePrevStep();
  };

  return (
    <div className="login-form" style={{ height: formHeight }} onKeyDown={handleKeyDown}>
      <div className="login-form-content" ref={contentRef}>
        <h2>로그인</h2>
        <div>
          <div className="login-field">
            <label htmlFor="username">이메일</label>
            <input
              type="email"
              id="username"
              value={inputUsername}
              onChange={(e) => setInputUsername(e.target.value.trim())}
              onKeyPress={handleKeyPress}
              ref={usernameRef}
              readOnly={step !== 1}
              className={step !== 1 ? 'disabled-input' : ''}
            />
          </div>

          {step >= 2 && (
            <>
              <div className="login-field">
                <label htmlFor="password">비밀번호</label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  ref={passwordRef}
                />
              </div>
              {step === 3 && (
                <div className="login-field">
                  <label htmlFor="confirmPassword">비밀번호 확인</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    ref={confirmPasswordRef}
                  />
                </div>
              )}
            </>
          )}

          <p className={`error-message ${error ? 'visible' : ''}`}>{error}</p>

          <div className="button-wrapper">
            <button
              onClick={step === 1 ? handleNextStep : handlePrevStep}
              className={step === 1 ? 'full-width-button' : 'half-width-button'}
            >
              {step === 1 ? '시작하기' : '돌아가기'}
            </button>
            {step !== 1 && (
              <button onClick={handleNextStep} className="half-width-button">
                {step === 2 ? '로그인' : '가입하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
