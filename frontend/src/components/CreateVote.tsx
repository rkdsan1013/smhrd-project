// /frontend/src/components/CreateVote.tsx
import React, { useState, useRef, useEffect } from "react";
import { createVote, CreateVoteRequest } from "../services/voteService";
import { AxiosError } from "axios";
import { formatYear, formatTwoDigits, getMaxDay } from "../utils/dateUtils";

interface CreateVoteProps {
  groupUuid: string;
  onVoteCreated: (voteUuid: string, type: "MULTI" | "SIMPLE") => void;
  onClose: () => void;
}

const CreateVote: React.FC<CreateVoteProps> = ({ groupUuid, onVoteCreated, onClose }) => {
  const [voteType, setVoteType] = useState<"MULTI" | "SIMPLE">("MULTI");
  const [title, setTitle] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);
  const [endYear, setEndYear] = useState<string>("");
  const [endMonth, setEndMonth] = useState<string>("");
  const [endDay, setEndDay] = useState<string>("");

  const endMonthRef = useRef<HTMLInputElement>(null);
  const endDayRef = useRef<HTMLInputElement>(null);

  const handleTypeChange = (type: "MULTI" | "SIMPLE") => {
    setVoteType(type);
    setOptions(type === "MULTI" ? ["", ""] : []);
  };

  const addOption = () => {
    if (voteType === "MULTI") {
      setOptions([...options, ""]);
    }
  };

  const removeOption = (index: number) => {
    if (voteType === "MULTI" && options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const updateOption = (index: number, value: string) => {
    if (voteType === "MULTI") {
      const updatedOptions = options.map((opt, i) => (i === index ? value : opt));
      setOptions(updatedOptions);
    }
  };

  // 종료 날짜 유효성 검사
  useEffect(() => {
    if (endYear && endMonth && endDay) {
      const y = parseInt(endYear, 10);
      const m = parseInt(endMonth, 10);
      if (!isNaN(y) && !isNaN(m) && m >= 1 && m <= 12) {
        const maxDay = getMaxDay(endYear, endMonth); // dateUtils 사용
        if (parseInt(endDay, 10) > maxDay) {
          setEndDay(formatTwoDigits(endDay, maxDay)); // dateUtils 사용
        }
      }
    }
  }, [endYear, endMonth, endDay]);

  const handleEndYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
    setEndYear(val);
    setError(null);
    if (val.length === 4) endMonthRef.current?.focus();
  };

  const handleEndYearBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setEndYear(formatYear(e.target.value)); // dateUtils 사용
    }
  };

  const handleEndMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setEndMonth(val);
    setError(null);
    if (val.length === 2) endDayRef.current?.focus();
  };

  const handleEndMonthBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setEndMonth(formatTwoDigits(e.target.value, 12)); // dateUtils 사용
    }
  };

  const handleEndDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, "").slice(0, 2);
    setEndDay(val);
    setError(null);
  };

  const handleEndDayBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const current = e.target.value;
    if (!current) setEndDay("");
    else {
      const maxDay = endYear && endMonth ? getMaxDay(endYear, endMonth) : 31; // dateUtils 사용
      setEndDay(formatTwoDigits(current, maxDay)); // dateUtils 사용
    }
  };

  const handleCreateVote = async () => {
    if (!title.trim()) {
      setError("투표 제목을 입력해주세요.");
      return;
    }

    if (!endYear || !endMonth || !endDay) {
      setError("투표 종료 날짜를 입력해주세요.");
      return;
    }

    const voteData: CreateVoteRequest = {
      groupUuid,
      type: voteType,
      title,
      endDate: `${endYear}-${endMonth}-${endDay}`,
    };

    if (voteType === "MULTI") {
      const validOptions = options.filter((opt) => opt.trim() !== "");
      if (validOptions.length < 2) {
        setError("다중 투표는 최소 2개의 유효한 옵션이 필요합니다.");
        return;
      }
      voteData.options = validOptions;
    }

    try {
      const response = await createVote(voteData);
      console.log("투표 생성 성공:", response);
      setError(null);
      onVoteCreated(response.voteUuid, voteType);
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError("투표 생성 실패: " + (error.response?.data?.message || error.message));
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center"
      onClick={handleBackdropClick}
    >
      <div className="w-[400px] bg-white rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center">새 투표 생성</h3>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="voteType"
              value="MULTI"
              checked={voteType === "MULTI"}
              onChange={() => handleTypeChange("MULTI")}
              className="form-radio"
            />
            <span className="text-sm text-gray-700">다중 투표</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="voteType"
              value="SIMPLE"
              checked={voteType === "SIMPLE"}
              onChange={() => handleTypeChange("SIMPLE")}
              className="form-radio"
            />
            <span className="text-sm text-gray-700">단일 투표</span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">투표 제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={voteType === "MULTI" ? "예: 다음 여행지 추천" : "예: 여행 참여 여부"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">투표 종료 날짜</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={endYear}
              onChange={handleEndYearChange}
              onBlur={handleEndYearBlur}
              className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YYYY"
              maxLength={4}
            />
            <input
              type="text"
              value={endMonth}
              onChange={handleEndMonthChange}
              onBlur={handleEndMonthBlur}
              ref={endMonthRef}
              className="w-16 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="MM"
              maxLength={2}
            />
            <input
              type="text"
              value={endDay}
              onChange={handleEndDayChange}
              onBlur={handleEndDayBlur}
              ref={endDayRef}
              className="w-16 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="DD"
              maxLength={2}
            />
          </div>
        </div>

        {voteType === "MULTI" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">투표 옵션</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`옵션 ${index + 1}`}
                />
                {options.length > 2 && (
                  <button
                    onClick={() => removeOption(index)}
                    className="px-2 py-1 text-red-500 hover:text-red-700"
                  >
                    삭제
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addOption}
              className="mt-2 px-3 py-1 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              옵션 추가
            </button>
          </div>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          onClick={handleCreateVote}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          투표 생성
        </button>
      </div>
    </div>
  );
};

export default CreateVote;
