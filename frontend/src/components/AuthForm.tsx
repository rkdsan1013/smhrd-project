// /src/components/AuthForm.tsx

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import {
  validateEmail,
  validatePassword,
} from '../utils/validators'; // 경로 수정
import {
  checkEmailExists,
  signIn,
  signUp,
} from '../services/authService'; // 인증 서비스 임포트
import './AuthForm.css';

interface AuthFormProps {
  onSignin: () => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ onSignin }) => {
  const { setUsername } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formValues, setFormValues] = useState<{
    email: string;
    password: string;
    confirmPassword: string;
  }>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [formHeight, setFormHeight] = useState<number | 'auto'>('auto');

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
  }, [step, errorMessage]);

  const handleNextStep = async () => {
    const { email, password, confirmPassword } = formValues;

    try {
      if (step === 1) {
        if (!validateEmail(email)) {
          setErrorMessage('유효한 이메일 주소를 입력하세요.');
          return;
        }
        const exists = await checkEmailExists(email);
        setStep(exists ? 2 : 3);
        setErrorMessage('');
      } else if (step === 2) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          setErrorMessage(passwordValidation.message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        const success = await signIn(email, password);
        if (success) {
          setUsername(email);
          onSignin();
        }
      } else if (step === 3) {
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          setErrorMessage(passwordValidation.message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('비밀번호가 일치하지 않습니다.');
          return;
        }
        const success = await signUp(email, password);
        if (success) {
          setUsername(email);
          onSignin();
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setFormValues((prev) => ({
      ...prev,
      password: '',
      confirmPassword: '',
    }));
    setErrorMessage('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;

    let newValue = value;
    let errorMsg = '';

    if (id === 'email') {
      if (value.length > 254) {
        errorMsg = `이메일은 최대 254자까지 입력할 수 있습니다.`;
      }
      newValue = value.slice(0, 254);
    } else if (id === 'password' || id === 'confirmPassword') {
      if (value.length > 60) {
        errorMsg = `비밀번호는 최대 60자까지 입력할 수 있습니다.`;
      }
      newValue = value.slice(0, 60);
    }

    setFormValues((prev) => ({
      ...prev,
      [id]: newValue,
    }));
    setErrorMessage(errorMsg);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const headerText =
    step === 1 ? '시작하기' : step === 2 ? '로그인' : '가입하기';

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
              value={formValues.email}
              onChange={handleChange}
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
                  value={formValues.password}
                  onChange={handleChange}
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
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                    onKeyPress={handleKeyPress}
                    ref={confirmPasswordInputRef}
                    placeholder=" "
                  />
                  <label htmlFor="confirmPassword">비밀번호 확인</label>
                </div>
              )}
            </>
          )}

          {errorMessage && <p className="error-message">{errorMessage}</p>}

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
