// AuthForm.tsx

import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useCallback,
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

  // 환경 변수에서 API URL 가져오기
  const API_URL = process.env.REACT_APP_API_URL;

  // 입력 필드 포커스 관리 최적화
  useEffect(() => {
    if (step === 1) {
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }
  }, [step]);

  // formHeight 계산 최적화
  useLayoutEffect(() => {
    if (contentRef.current) {
      setFormHeight(contentRef.current.scrollHeight);
    }
  }, [step, errorMessage]);

  // 이메일 유효성 검사 함수 메모화
  const validateEmail = useCallback(
    (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    []
  );

  // 에러 처리 함수 메모화
  const handleError = useCallback(
    (error: unknown, defaultMessage: string) => {
      if (axios.isAxiosError(error)) {
        const err = error as AxiosError<ErrorResponseData>;
        setErrorMessage(err.response?.data?.message || defaultMessage);
      } else {
        setErrorMessage('알 수 없는 오류가 발생했습니다.');
      }
    },
    []
  );

  // 다음 단계로 이동하는 함수 최적화
  const handleNextStep = useCallback(async () => {
    if (step === 1) {
      if (!validateEmail(email)) {
        setErrorMessage('유효한 이메일 주소를 입력하세요.');
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/check-email`, { email });
        if (response.data.exists) {
          setStep(2); // 로그인 폼으로 이동
        } else {
          setStep(3); // 가입하기 폼으로 이동
        }
        setErrorMessage('');
      } catch (error) {
        handleError(error, '서버와 통신 중 오류가 발생했습니다.');
      }
    } else if (step === 2) {
      // 로그인 처리
      try {
        const response = await axios.post(`${API_URL}/login`, {
          email,
          password,
        });
        if (response.data.success) {
          setUsername(email);
          onSignin();
        }
      } catch (error) {
        handleError(error, '로그인 중 오류가 발생했습니다.');
      }
    } else if (step === 3) {
      // 회원가입 처리
      if (password.length < 8) {
        setErrorMessage('비밀번호는 최소 8자 이상이어야 합니다.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('비밀번호가 일치하지 않습니다.');
        return;
      }
      try {
        const response = await axios.post(`${API_URL}/register`, {
          email,
          password,
        });
        if (response.data.success) {
          setUsername(email);
          onSignin();
        }
      } catch (error) {
        handleError(error, '회원가입 중 오류가 발생했습니다.');
      }
    }
  }, [
    step,
    email,
    password,
    confirmPassword,
    API_URL,
    validateEmail,
    handleError,
    setUsername,
    onSignin,
  ]);

  // 이전 단계로 이동하는 함수 최적화
  const handlePrevStep = useCallback(() => {
    setStep(1);
    setPassword('');
    setConfirmPassword('');
    setErrorMessage('');
  }, []);

  // 입력 값 변경 핸들러 최적화
  const handleChange = useCallback(
    (setter: React.Dispatch<React.SetStateAction<string>>) => (
      e: React.ChangeEvent<HTMLInputElement>
    ) => {
      setter(e.target.value);
      setErrorMessage('');
    },
    []
  );

  // 키 입력 핸들러 최적화
  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') handleNextStep();
    },
    [handleNextStep]
  );

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
