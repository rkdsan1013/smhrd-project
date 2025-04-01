import React, { useState } from "react";

interface FormData {
  name: string;
  description: string;
  maxMembers: number;
  hashtag: string;
  isPublic: boolean;
  image: string | null;
}

const GroupForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    maxMembers: 1,
    hashtag: "",
    isPublic: true,
    image: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);

  // 입력값 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof FormData) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  // 이미지 변경 핸들러
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // 공개 여부 토글 핸들러
  const togglePublic = () => {
    setFormData({ ...formData, isPublic: !formData.isPublic });
  };

  // 폼 제출 핸들러
  const handleSubmit = () => {
    if (!formData.name.trim()) {
      setError("그룹 이름은 필수입니다.");
      return;
    }
    setError(null);
    console.log("그룹 생성 데이터:", formData);
    handleClose();
  };

  // 폼 닫기 핸들러
  const handleClose = () => {
    setIsOpen(false);
    setFormData({
      name: "",
      description: "",
      maxMembers: 1,
      hashtag: "",
      isPublic: true,
      image: null,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="w-[360px] bg-white rounded-2xl p-6 flex flex-col">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">그룹 만들기</h2>

        {/* 이미지 업로드 */}
        <label htmlFor="imageInput" className="self-center cursor-pointer mb-6">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
            {formData.image ? (
              <img src={formData.image} alt="Group" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl text-gray-400">+</span>
            )}
          </div>
        </label>

        {/* 에러 메시지 */}

        {/* 입력 필드 */}
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">그룹 이름</label>
            <input
              type="text"
              placeholder="그룹 이름 입력"
              value={formData.name}
              onChange={(e) => handleInputChange(e, "name")}
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">한마디</label>
            <input
              type="text"
              placeholder="그룹을 소개해주세요"
              value={formData.description}
              onChange={(e) => handleInputChange(e, "description")}
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">최대 인원</label>
            <input
              type="number"
              min="1"
              placeholder="최대 인원 입력"
              value={formData.maxMembers}
              onChange={(e) => handleInputChange(e, "maxMembers")}
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">해시태그</label>
            <input
              type="text"
              placeholder="#태그 입력"
              value={formData.hashtag}
              onChange={(e) => handleInputChange(e, "hashtag")}
              className="w-full mt-1 p-3 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* 토글 스위치 */}
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">공개 그룹</label>
            <div
              className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                formData.isPublic ? "bg-blue-500" : "bg-gray-300"
              }`}
              onClick={togglePublic}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition-transform ${
                  formData.isPublic ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {/* 버튼 */}
        <div className="mt-6 flex space-x-2">
          <button
            className="flex-1 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
            onClick={handleSubmit}
          >
            만들기
          </button>
          <button
            className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
            onClick={handleClose}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupForm;
