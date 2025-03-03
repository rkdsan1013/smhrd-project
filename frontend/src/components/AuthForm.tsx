// AuthForm.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useUser } from '../contexts/UserContext';
import axios, { AxiosError } from 'axios';
import './AuthForm.css';

interface AuthFormProps {
  onSignin: () => void;
}

interface ErrorResponseData {
  message?: string;
}

const MAX_EMAIL_LENGTH = 254;
const MIN_EMAIL_LENGTH = 5;
const MAX_PASSWORD_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 8;

const AuthForm: React.FC<AuthFormProps> = ({ onSignin }) => {
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

  const API_URL = process.env.REACT_APP_API_URL || '';

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

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      email.length >= MIN_EMAIL_LENGTH &&
      email.length <= MAX_EMAIL_LENGTH &&
      emailRegex.test(email)
    );
  };

  const handleError = (error: unknown, defaultMessage: string) => {
    if (axios.isAxiosError(error) && error.response) {
      setErrorMessage(error.response.data?.message || defaultMessage);
    } else {
      setErrorMessage('알 수 없는 오류가 발생했습니다.');
    }
  };

  const handleNextStep = async () => {
    const { email, password, confirmPassword } = formValues;

    if (step === 1) {
      if (!validateEmail(email)) {
        setErrorMessage(
          `유효한 이메일 주소를 입력하세요. (${MIN_EMAIL_LENGTH}자 이상, 최대 ${MAX_EMAIL_LENGTH}자)`
        );
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/check-email`, { email });
        setStep(response.data.exists ? 2 : 3);
        setErrorMessage('');
      } catch (error) {
        handleError(error, '서버와 통신 중 오류가 발생했습니다.');
      }
    } else if (step === 2) {
      try {
        const response = await axios.post(`${API_URL}/sign-in`, { email, password });
        if (response.data.success) {
          setUsername(email);
          onSignin();
        }
      } catch (error) {
        handleError(error, '로그인 중 오류가 발생했습니다.');
      }
    } else if (step === 3) {
      if (password.length < MIN_PASSWORD_LENGTH) {
        setErrorMessage(`비밀번호는 최소 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
        return;
      }
      if (password.length > MAX_PASSWORD_LENGTH) {
        setErrorMessage(`비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자 이하로 입력해주세요.`);
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/sign-up`, { email, password });
        if (response.data.success) {
          setUsername(email);
          onSignin();
        }
      } catch (error) {
        handleError(error, '회원가입 중 오류가 발생했습니다.');
      }
    }
  };

  const handlePrevStep = () => {
    setStep(1);
    setFormValues({ email: formValues.email, password: '', confirmPassword: '' });
    setErrorMessage('');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    if (
      (id === 'email' && value.length > MAX_EMAIL_LENGTH) ||
      ((id === 'password' || id === 'confirmPassword') &&
        value.length > MAX_PASSWORD_LENGTH)
    ) {
      return;
    }
    setFormValues((prev) => ({ ...prev, [id]: value }));
    setErrorMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const headerText = step === 1 ? '시작하기' : step === 2 ? '로그인' : '가입하기';

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
              maxLength={MAX_EMAIL_LENGTH}
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
                  maxLength={MAX_PASSWORD_LENGTH}
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
                    maxLength={MAX_PASSWORD_LENGTH}
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
