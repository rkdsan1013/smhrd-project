import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './AuthForm.css';

interface AuthFormProps {
  onSignin: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSignin }) => {
  const [step, setStep] = useState<number>(1);
  const { setUsername } = useUser();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [formHeight, setFormHeight] = useState<number | string>('auto');

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (emailRef.current) emailRef.current.focus();
  }, []);

  useEffect(() => {
    if (step === 1 && emailRef.current) {
      emailRef.current.focus();
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
  }, [step, error, email, password, confirmPassword]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateEmail(email)) {
        setError('유효한 이메일 주소를 입력하세요.');
        return;
      }

      setError('');
      setStep(email === 'smhrd123@example.com' ? 2 : 3);
    } else if (step === 2) {
      if (email === 'smhrd123@example.com' && password === 'smhrd123') {
        onSignin();
        setUsername(email);
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
      onSignin();
      setUsername(email);
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setPassword('');
    setConfirmPassword('');
    setError('');
    if (emailRef.current) {
      emailRef.current.focus();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape' && step > 1) handlePrevStep();
  };

  const getHeaderText = () => {
    if (step === 1) {
      return '시작하기';
    }
    return email === 'smhrd123@example.com' ? '로그인' : '가입하기';
  };

  return (
    <div className="auth-form" style={{ height: formHeight }} onKeyDown={handleKeyDown}>
      <div className="auth-form-content" ref={contentRef}>
        <h2>{getHeaderText()}</h2>
        <div>
          <div className="signin-field">
            <label htmlFor="email">이메일</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              onKeyPress={handleKeyPress}
              ref={emailRef}
              readOnly={step !== 1}
              className={step !== 1 ? 'disabled-input' : ''}
            />
          </div>

          {step >= 2 && (
            <>
              <div className="signin-field">
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
                <div className="signin-field">
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

export default AuthForm;
