// /frontend/src/components/CreateVote.tsx
import React, { useState } from "react";
import { createVote, CreateVoteRequest } from "../services/voteService";
import { AxiosError } from "axios";

interface CreateVoteProps {
  groupUuid: string;
  onVoteCreated: (voteUuid: string, type: "MULTI" | "SIMPLE") => void; // 두 인자 받도록 수정
}

const CreateVote: React.FC<CreateVoteProps> = ({ groupUuid, onVoteCreated }) => {
  const [voteType, setVoteType] = useState<"MULTI" | "SIMPLE">("MULTI");
  const [title, setTitle] = useState<string>("");
  const [options, setOptions] = useState<string[]>(["", ""]);
  const [error, setError] = useState<string | null>(null);

  // 투표 유형 변경
  const handleTypeChange = (type: "MULTI" | "SIMPLE") => {
    setVoteType(type);
    setOptions(type === "MULTI" ? ["", ""] : []);
  };

  // 옵션 추가 (MULTI 전용)
  const addOption = () => {
    if (voteType === "MULTI") {
      setOptions([...options, ""]);
    }
  };

  // 옵션 삭제 (MULTI 전용)
  const removeOption = (index: number) => {
    if (voteType === "MULTI" && options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  // 옵션 내용 변경 (MULTI 전용)
  const updateOption = (index: number, value: string) => {
    if (voteType === "MULTI") {
      const updatedOptions = options.map((opt, i) => (i === index ? value : opt));
      setOptions(updatedOptions);
    }
  };

  // 투표 생성 핸들러
  const handleCreateVote = async () => {
    if (!title.trim()) {
      setError("투표 제목을 입력해주세요.");
      return;
    }

    const voteData: CreateVoteRequest = {
      groupUuid,
      type: voteType,
      title,
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
      onVoteCreated(response.voteUuid, voteType); // 두 인자 전달
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError("투표 생성 실패: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="w-[400px] bg-white rounded-2xl p-6 flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-gray-900 text-center">새 투표 생성</h3>

        {/* 투표 유형 선택 */}
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

        {/* 투표 제목 입력 */}
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

        {/* 옵션 입력 (MULTI일 때만 표시) */}
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

        {/* 에러 메시지 */}
        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* 생성 버튼 */}
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
