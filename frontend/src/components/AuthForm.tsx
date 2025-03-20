// /frontend/src/AuthForm.tsx
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { validateEmail, validatePassword } from '../utils/validators';
import { checkEmailExists, signIn as signInService, signUp as signUpService } from '../services/authService';

type FormState = 'start' | 'signin' | 'signup';

const formConfig: Record<FormState, { title: string; buttonLabel: string }> = {
  start: { title: '시작하기', buttonLabel: '시작하기' },
  signin: { title: '로그인', buttonLabel: '로그인' },
  signup: { title: '회원가입', buttonLabel: '가입하기' },
};

const AuthForm: React.FC = () => {
  const [formState, setFormState] = useState<FormState>('start');
  const [errorMsg, setErrorMsg] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const formatError = (error: unknown): string =>
    (error instanceof Error ? error.message : String(error)).replace(/^Error:\s*/, '');

  useEffect(() => {
    if (formState === 'start') {
      emailRef.current?.focus();
    } else if (formState === 'signin' || formState === 'signup') {
      passwordRef.current?.focus();
    }
  }, [formState]);

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => 
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setErrorMsg('');
    };

  const handleBack = useCallback(() => {
    setFormState('start');
    setPassword('');
    setConfirmPassword('');
    setErrorMsg('');
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((formState === 'signin' || formState === 'signup') && e.key === 'Escape') {
      handleBack();
    }
  };

  const handleAuthSuccess = (
    resp: { user?: { uuid: string; email: string } },
    successMsg: string
  ) => {
    console.log(successMsg, resp);
    window.dispatchEvent(new CustomEvent('userSignedIn', { detail: { user: resp.user } }));
  };

  const handleStartSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || '유효한 이메일을 입력해주세요.');
      return;
    }
    try {
      const exists = await checkEmailExists(email);
      setFormState(exists ? 'signin' : 'signup');
      setErrorMsg('');
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSignInSubmit = async () => {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || '비밀번호가 유효하지 않습니다.');
      return;
    }
    try {
      const resp = await signInService(email, password);
      if (resp.success) {
        handleAuthSuccess(resp, '로그인 성공:');
      } else {
        setErrorMsg('로그인에 실패했습니다.');
      }
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSignUpSubmit = async () => {
    const emailValidation = validateEmail(email);
    if (!emailValidation.valid) {
      setErrorMsg(emailValidation.message || '유효한 이메일을 입력해주세요.');
      return;
    }
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      setErrorMsg(passwordValidation.message || '비밀번호가 유효하지 않습니다.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('비밀번호가 일치하지 않습니다.');
      return;
    }
    try {
      const resp = await signUpService(email, password);
      if (resp.success) {
        handleAuthSuccess(resp, '회원가입 성공:');
      } else {
        setErrorMsg('회원가입에 실패했습니다.');
      }
    } catch (error) {
      setErrorMsg(formatError(error));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);
    try {
      switch (formState) {
        case 'start':
          await handleStartSubmit();
          break;
        case 'signin':
          await handleSignInSubmit();
          break;
        case 'signup':
          await handleSignUpSubmit();
          break;
        default:
          break;
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isAuthStep = formState === 'signin' || formState === 'signup';
  const isSignUp = formState === 'signup';

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-100 via-blue-200 to-blue-300">
      <div className="w-full max-w-md p-8 bg-white shadow-2xl rounded-2xl">
        <h2 className="mb-6 text-3xl font-bold text-left text-gray-800">
          {formConfig[formState].title}
        </h2>
        <form onSubmit={handleSubmit} noValidate onKeyDown={handleKeyDown}>
          <div className="relative z-0 w-full mb-6">
            <input
              type="email"
              id="email"
              ref={emailRef}
              value={email}
              onChange={handleInputChange(setEmail)}
              disabled={formState !== 'start'}
              className={`peer block w-full appearance-none border-0 border-b-2 pb-2.5 pt-4 text-base focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 ${
                formState !== 'start'
                  ? 'bg-gray-200 cursor-not-allowed opacity-50'
                  : 'bg-transparent'
              }`}
              placeholder=" "
            />
            <label
              htmlFor="email"
              className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75
                         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
                         peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
            >
              이메일
            </label>
          </div>

          {isAuthStep && (
            <div className="relative z-0 w-full mb-6">
              <input
                type="password"
                id="password"
                ref={passwordRef}
                value={password}
                onChange={handleInputChange(setPassword)}
                className="peer block w-full appearance-none border-0 border-b-2 bg-transparent pb-2.5 pt-4 text-base text-gray-900 focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600"
                placeholder=" "
              />
              <label
                htmlFor="password"
                className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75
                         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
                         peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
              >
                비밀번호
              </label>
            </div>
          )}

          {isSignUp && (
            <div className="relative z-0 w-full mb-6">
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={handleInputChange(setConfirmPassword)}
                className="peer block w-full appearance-none border-0 border-b-2 bg-transparent pb-2.5 pt-4 text-base text-gray-900 focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600"
                placeholder=" "
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-0 top-4 z-10 origin-0 text-sm text-gray-500 duration-300 transform -translate-y-6 scale-75
                         peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100
                         peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600"
              >
                비밀번호 확인
              </label>
            </div>
          )}

          {errorMsg && (
            <p className="mt-2 mb-4 text-left text-red-500 text-sm">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2 mb-4 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-75"
          >
            <div className="flex items-center justify-center">
              {isLoading && (
                <svg
                  className="animate-spin mr-2 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              )}
              <span>{formConfig[formState].buttonLabel}</span>
            </div>
          </button>

          {isAuthStep && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="w-full py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              뒤로가기
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default AuthForm;