import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import './AuthForm.css';

interface AuthFormProps {
  onSignin: () => void;
}

const DEMO_EMAIL = 'test1234@test.com';
const DEMO_PASSWORD = 'test1234';

const AuthForm: React.FC<AuthFormProps> = ({ onSignin }) => {
  const { setUsername } = useUser();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [formHeight, setFormHeight] = useState<number | string>('auto');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  useLayoutEffect(() => {
    if (contentRef.current) {
      setFormHeight(contentRef.current.scrollHeight);
    }
  }, [step, errorMessage, email, password, confirmPassword]);

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleNextStep = () => {
    if (step === 1) {
      if (!validateEmail(email)) {
        setErrorMessage('유효한 이메일 주소를 입력하세요.');
        return;
      }
      setErrorMessage('');
      setStep(email === DEMO_EMAIL ? 2 : 3);
    } else if (step === 2) {
      if (password === DEMO_PASSWORD) {
        setUsername(email);
        onSignin();
      } else {
        setErrorMessage('아이디 또는 비밀번호가 잘못되었습니다.');
      }
    } else if (step === 3) {
      if (password.length < 8) {
        setErrorMessage('비밀번호는 최소 8자 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        return;
      }
      setUsername(email);
      onSignin();
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  };

  const handleChange =
    (setter: React.Dispatch<React.SetStateAction<string>>) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setErrorMessage('');
    };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const headerText =
    step === 1 ? '시작하기' : email === DEMO_EMAIL ? '로그인' : '가입하기';

  return (
    <div
      className="auth-form"
      style={{ height: formHeight }}
      onKeyDown={(e) => e.key === 'Escape' && step > 1 && handlePrevStep()}
    >
      <div className="auth-form-content" ref={contentRef}>
        <h2>{headerText}</h2>
        <div>
          <div className="form-field">
            <input
              type="email"
              id="email"
              value={email}
              onChange={handleChange(setEmail)}
              onKeyPress={handleKeyPress}
              ref={emailInputRef}
              placeholder=" "
              readOnly={step !== 1}
              className={step !== 1 ? 'readonly' : ''}
            />
            <label htmlFor="email">이메일</label>
          </div>

          {step >= 2 && (
            <>
              <div className="form-field">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={handleChange(setPassword)}
                  onKeyPress={handleKeyPress}
                  ref={passwordInputRef}
                  placeholder=" "
                />
                <label htmlFor="password">비밀번호</label>
              </div>
              {step === 3 && (
                <div className="form-field">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={handleChange(setConfirmPassword)}
                    onKeyPress={handleKeyPress}
                    ref={confirmPasswordInputRef}
                    placeholder=" "
                  />
                  <label htmlFor="confirmPassword">비밀번호 확인</label>
                </div>
              )}
            </>
          )}

          {errorMessage && (
            <p className="error-message">{errorMessage}</p>
          )}

          <div className="button-group">
            <button
              onClick={step === 1 ? handleNextStep : handlePrevStep}
              className={step === 1 ? 'full-width' : 'half-width'}
            >
              {step === 1 ? '시작하기' : '돌아가기'}
            </button>
            {step !== 1 && (
              <button onClick={handleNextStep} className="half-width">
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
