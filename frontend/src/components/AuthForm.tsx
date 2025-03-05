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
  const [authStep, setAuthStep] = useState<1 | 2 | 3>(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [formHeight, setFormHeight] = useState<number | 'auto'>('auto');

  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const confirmPasswordInputRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // 각 인증 단계에 따라 입력 필드에 포커스 설정
  useEffect(() => {
    if (authStep === 1) {
      emailInputRef.current?.focus();
    } else {
      passwordInputRef.current?.focus();
    }
  }, [authStep]);

  // 콘텐츠 영역의 높이를 동적으로 계산하여 애니메이션 등에 활용
  useLayoutEffect(() => {
    if (contentRef.current) {
      setFormHeight(contentRef.current.scrollHeight);
    }
  }, [authStep, errorMsg]);

  const handleNextStep = async () => {
    const { email, password, confirmPassword } = formData;
    try {
      if (authStep === 1) {
        if (!validateEmail(email)) {
          setErrorMsg('유효한 이메일 주소를 입력하세요.');
          return;
        }
        const emailExists = await checkEmailExists(email);
        setAuthStep(emailExists ? 2 : 3);
        setErrorMsg('');
      } else if (authStep === 2) {
        const { valid, message } = validatePassword(password);
        if (!valid) {
          setErrorMsg(message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        const isSignedIn = await signIn(email, password);
        if (isSignedIn) {
          setUsername(email);
          // 로그인 성공 시 전역 이벤트 발행
          window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { email } }));
        }
      } else if (authStep === 3) {
        const { valid, message } = validatePassword(password);
        if (!valid) {
          setErrorMsg(message || '비밀번호가 유효하지 않습니다.');
          return;
        }
        if (password !== confirmPassword) {
          setErrorMsg('비밀번호가 일치하지 않습니다.');
          return;
        }
        const isSignedUp = await signUp(email, password);
        if (isSignedUp) {
          setUsername(email);
          window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { email } }));
        }
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        setErrorMsg(error.message);
      } else {
        setErrorMsg('알 수 없는 오류가 발생했습니다.');
      }
    }
  };

  const handlePrevStep = () => {
    setAuthStep(1);
    setFormData((prev) => ({ ...prev, password: '', confirmPassword: '' }));
    setErrorMsg('');
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    let updatedValue = value;
    let validationError = '';

    if (id === 'email') {
      if (value.length > MAX_EMAIL_LENGTH) {
        validationError = `이메일은 최대 ${MAX_EMAIL_LENGTH}자까지 입력할 수 있습니다.`;
      }
      updatedValue = value.slice(0, MAX_EMAIL_LENGTH);
    } else if (id === 'password' || id === 'confirmPassword') {
      if (value.length > MAX_PASSWORD_LENGTH) {
        validationError = `비밀번호는 최대 ${MAX_PASSWORD_LENGTH}자까지 입력할 수 있습니다.`;
      }
      updatedValue = value.slice(0, MAX_PASSWORD_LENGTH);
    }

    setFormData((prev) => ({ ...prev, [id]: updatedValue }));
    setErrorMsg(validationError);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleNextStep();
  };

  const headerText =
    authStep === 1 ? '시작하기' : authStep === 2 ? '로그인' : '가입하기';

  return (
    <div
      className="auth-form"
      style={{ height: formHeight }}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && authStep > 1) handlePrevStep();
      }}
    >
      <div className="auth-form-content" ref={contentRef}>
        <h2>{headerText}</h2>
        <div>
          <div className="form-field">
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              onKeyPress={handleKeyPress}
              ref={emailInputRef}
              placeholder=" "
              readOnly={authStep !== 1}
              className={authStep !== 1 ? 'readonly' : ''}
            />
            <label htmlFor="email">이메일</label>
          </div>

          {authStep >= 2 && (
            <>
              <div className="form-field">
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  ref={passwordInputRef}
                  placeholder=" "
                />
                <label htmlFor="password">비밀번호</label>
              </div>
              {authStep === 3 && (
                <div className="form-field">
                  <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
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

          {errorMsg && <p className="error-message">{errorMsg}</p>}

          <div className="button-group">
            <button
              onClick={authStep === 1 ? handleNextStep : handlePrevStep}
              className={authStep === 1 ? 'full-width' : 'half-width'}
            >
              {authStep === 1 ? '시작하기' : '뒤로가기'}
            </button>
            {authStep !== 1 && (
              <button onClick={handleNextStep} className="half-width">
                {authStep === 2 ? '로그인' : '가입하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;
