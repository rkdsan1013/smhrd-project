// /src/components/AuthForm.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  KeyboardEvent,
  ChangeEvent,
} from 'react';
import { useUser } from '../contexts/UserContext';
import {
  validateEmail,
  validatePassword,
  MAX_EMAIL_LENGTH,
  MAX_PASSWORD_LENGTH,
} from '../utils/validators';
import { checkEmailExists, signIn, signUp } from '../services/authService';
import './AuthForm.css';

const AuthForm: React.FC = () => {
  const { setUsername } = useUser();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [formValues, setFormValues] = useState({
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

  // step에 따라 입력 포커스 설정
  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  // 콘텐츠 높이를 측정하여 애니메이션이나 레이아웃에 활용
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
        const validation = validatePassword(password);
        if (!validation.valid) {
          setErrorMessage(validation.message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        const success = await signIn(email, password);
        if (success) {
          setUsername(email);
          // 로그인 성공 시 전역 이벤트를 발행하여 App에 통지
          window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { email } }));
        }
      } else if (step === 3) {
        const validation = validatePassword(password);
        if (!validation.valid) {
          setErrorMessage(validation.message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMessage('비밀번호가 일치하지 않습니다.');
          return;
        }
        const success = await signUp(email, password);
        if (success) {
          setUsername(email);
          window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { email } }));
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
    setFormValues((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    setErrorMessage('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let newValue = value;
    let errorMsg = '';

    if (id === 'email') {
      if (value.length > MAX_EMAIL_LENGTH) {
        errorMsg = `이메일은 최대 ${MAX_EMAIL_LENGTH}자까지 입력할 수 있습니다.`;
      }
      newValue = value.slice(0, MAX_EMAIL_LENGTH);
    } else if (id === 'password' || id === 'confirmPassword') {
      if (value.length > MAX_PASSWORD_LENGTH) {
        errorMsg = `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자까지 입력할 수 있습니다.`;
      }
      newValue = value.slice(0, MAX_PASSWORD_LENGTH);
    }

    setFormValues((prev) => ({ ...prev, [id]: newValue }));
    setErrorMessage(errorMsg);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const headerText = step === 1 ? '시작하기' : step === 2 ? '로그인' : '가입하기';

  return (
    <div
      className="auth-form"
      style={{ height: formHeight }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && step > 1) handlePrevStep();
      }}
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
              {step === 1 ? '시작하기' : '뒤로가기'}
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
