// /frontend/src/components/TravelSurveyModal.tsx

import { useState } from "react";
import ReactDOM from "react-dom";
import { submitSurvey } from "../services/surveyService";
import Icons from "./Icons";

interface TravelSurveyModalProps {
  isVisible: boolean;
  onClose: () => void;
  userUuid?: string | null;
}

const questions = [
  {
    title: "선호하는 여행 활동은 무엇인가요?",
    key: "activity",
    options: ["맛집탐방", "액티비티", "휴양", "문화/역사 체험"],
  },
  {
    title: "선호하는 여행 예산 방식은 무엇인가요?",
    key: "budget",
    options: ["가성비", "럭셔리"],
  },
  {
    title: "선호하는 여행 기간은 어떻게 되나요?",
    key: "duration",
    options: ["당일치기", "7일 미만", "7일 이상"],
  },
];

const TravelSurveyModal = ({ isVisible, onClose, userUuid }: TravelSurveyModalProps) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    activity: "",
    budget: "",
    duration: "",
  });
  const [isAnimating, setIsAnimating] = useState(false);

  const handleChange = (key: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
    if (step < questions.length - 1) {
      handleNextStep();
    }
  };

  const handleNextStep = () => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(step + 1);
      setTimeout(() => setIsAnimating(false), 100);
    }, 300);
  };

  const handlePreviousStep = () => {
    if (step > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setStep(step - 1);
        setTimeout(() => setIsAnimating(false), 100);
      }, 300);
    }
  };

  // Skip 버튼 동작 (마지막 질문 전까지만 사용)
  const handleSkip = () => {
    if (step < questions.length - 1) {
      handleNextStep();
    }
  };

  // 제출 로직 (체크 안 된 항목은 0으로 채움)
  const handleSubmit = async () => {
    const surveyData = {
      user_uuid: userUuid || "temp-uuid",
      activity_type: answers.activity ? questions[0].options.indexOf(answers.activity) + 1 : 0,
      budget_type: answers.budget ? questions[1].options.indexOf(answers.budget) + 1 : 0,
      trip_duration: answers.duration ? questions[2].options.indexOf(answers.duration) + 1 : 0,
    };

    try {
      await submitSurvey(surveyData);
      console.log("설문 제출 성공!");
      onClose();
    } catch (error) {
      console.error("설문 제출 실패:", error);
      alert("설문 제출에 실패했습니다. 다시 시도해주세요.");
    }
  };

  // 창 닫기 버튼은 기본값 제출 후 종료
  const handleClose = async () => {
    const defaultSurveyData = {
      user_uuid: userUuid || "temp-uuid",
      activity_type: answers.activity ? questions[0].options.indexOf(answers.activity) + 1 : 0,
      budget_type: answers.budget ? questions[1].options.indexOf(answers.budget) + 1 : 0,
      trip_duration: answers.duration ? questions[2].options.indexOf(answers.duration) + 1 : 0,
    };

    try {
      await submitSurvey(defaultSurveyData);
      console.log("기본값 설문 제출 성공!");
      onClose();
    } catch (error) {
      console.error("기본값 설문 제출 실패:", error);
      alert("설문 저장에 실패했습니다.");
    }
  };

  if (!isVisible) return null;

  const currentQuestion = questions[step];

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/60"></div>
      <div className="bg-gradient-to-br from-white to-gray-100 p-8 rounded-3xl shadow-2xl z-10 w-[90%] max-w-lg transform transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
            당신의 여행 스타일을 알려주세요
            <Icons name="plane" className="w-6 h-6 text-blue-500 animate-bounce" />
          </h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 transition">
            <Icons name="close" className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`mb-6 transition-opacity duration-300 ${
            isAnimating ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="text-lg font-semibold text-gray-700 mb-4">
            {step + 1}. {currentQuestion.title}
          </p>
          <div className="flex flex-col gap-3">
            {currentQuestion.options.map((opt) => (
              <label
                key={opt}
                className={`flex items-center p-3 rounded-lg cursor-pointer transition-all duration-300 border 
                  ${
                    answers[currentQuestion.key as keyof typeof answers] === opt
                      ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white border-blue-500 shadow-lg"
                      : "bg-gray-50 text-gray-800 hover:bg-gray-100 border-gray-200 hover:shadow-md"
                  }`}
                onClick={() => handleChange(currentQuestion.key, opt)}
              >
                <input
                  type="radio"
                  name={currentQuestion.key}
                  value={opt}
                  checked={answers[currentQuestion.key as keyof typeof answers] === opt}
                  onChange={() => {}}
                  className="mr-3 accent-blue-500"
                />
                <span>{opt}</span>
                {answers[currentQuestion.key as keyof typeof answers] === opt && (
                  <Icons name="check" className="w-5 h-5 ml-auto text-white animate-pulse" />
                )}
              </label>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            {step < questions.length - 1 && (
              <button
                onClick={handleSkip}
                className="text-gray-500 text-sm hover:text-gray-700 transition-all duration-200 hover:underline hover:underline-offset-4"
              >
                건너뛰기
              </button>
            )}
            {step > 0 && (
              <button
                onClick={handlePreviousStep}
                className="flex items-center gap-1 text-blue-500 font-medium hover:text-blue-600 transition"
              >
                <Icons name="arrowLeft" className="w-4 h-4" />
                이전
              </button>
            )}
          </div>
          {step === questions.length - 1 && (
            <button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg px-6 py-2 hover:from-blue-600 hover:to-indigo-700 transition-all duration-300 transform hover:scale-105"
            >
              제출하기
            </button>
          )}
        </div>

        <div className="mt-6 flex justify-center gap-2">
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((step + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TravelSurveyModal;
