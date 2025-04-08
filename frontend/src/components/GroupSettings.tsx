// /frontend/src/components/GroupSettings.tsx

import React, { useState } from "react";
import { GroupInfo, updateGroup, UpdateGroupPayload } from "../services/groupService";
import Icons from "./Icons";

// 플로팅 라벨 효과를 위한 클래스 정의
const baseInputClass =
  "peer block w-full border-0 border-b-2 pb-2.5 pt-4 text-base bg-transparent focus:outline-none focus:ring-0 border-gray-300 focus:border-blue-600 transition-all duration-300 ease-in-out";
const labelClass =
  "absolute left-0 top-4 z-10 text-sm text-gray-500 whitespace-nowrap origin-top-left duration-300 transform -translate-y-6 scale-75 peer-placeholder-shown:translate-y-0 peer-placeholder-shown:scale-100 peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-600";

interface GroupSettingsProps {
  group: GroupInfo;
  onUpdate?: (group: GroupInfo) => void;
}

const GroupSettings: React.FC<GroupSettingsProps> = ({ group, onUpdate }) => {
  // 초기 그룹 정보 상태
  const [groupName, setGroupName] = useState(group.name);
  const [groupDescription, setGroupDescription] = useState(group.description || "");
  const [groupVisibility, setGroupVisibility] = useState<"public" | "private">(group.visibility);

  // 파일 상태 및 미리보기 URL
  const [groupIconFile, setGroupIconFile] = useState<File | null>(null);
  const [groupPictureFile, setGroupPictureFile] = useState<File | null>(null);
  const [groupIconPreview, setGroupIconPreview] = useState<string>(group.group_icon || "");
  const [groupPicturePreview, setGroupPicturePreview] = useState<string>(group.group_picture || "");

  // 그룹 아이콘 파일 선택 시 미리보기 업데이트
  const handleGroupIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setGroupIconFile(file);
      setGroupIconPreview(URL.createObjectURL(file));
    }
  };

  // 그룹 사진 파일 선택 시 미리보기 업데이트
  const handleGroupPictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setGroupPictureFile(file);
      setGroupPicturePreview(URL.createObjectURL(file));
    }
  };

  // 그룹 정보 업데이트 처리 (API 호출)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: UpdateGroupPayload = {
      uuid: group.uuid,
      name: groupName,
      description: groupDescription,
      visibility: groupVisibility,
      groupIcon: groupIconFile,
      groupPicture: groupPictureFile,
    };
    try {
      const updatedGroup = await updateGroup(payload);
      console.log("그룹 정보 업데이트 성공", updatedGroup);
      if (onUpdate) {
        onUpdate(updatedGroup);
      }
      // 서버에서 반환된 URL로 미리보기 업데이트
      setGroupIconPreview(updatedGroup.group_icon || "");
      setGroupPicturePreview(updatedGroup.group_picture || "");
    } catch (error) {
      console.error("그룹 정보 업데이트 실패", error);
    }
  };

  const handleLeaveGroup = () => {
    if (window.confirm("정말 그룹을 탈퇴하시겠습니까? 해당 작업은 취소할 수 없습니다.")) {
      console.log("그룹 탈퇴 로직 실행");
    }
  };

  return (
    // h-full과 overflow-y-auto 클래스를 추가하여 내용이 많을 경우 스크롤이 가능하도록 함
    <div className="max-w-3xl mx-auto p-6 space-y-8 h-full overflow-y-auto">
      {/* 헤더 영역 */}
      <header className="mb-4">
        <h2 className="text-2xl font-bold text-left border-b pb-2">설정</h2>
      </header>

      {/* 그룹 정보 수정 섹션 */}
      <section className="p-6 border border-gray-200 rounded shadow-sm">
        <h3 className="text-xl font-semibold mb-6">그룹 정보 수정</h3>
        <form onSubmit={handleSave} className="space-y-6">
          {/* 아이콘과 그룹 이름 (수평 배치) */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-4">
            {/* 그룹 아이콘 영역 */}
            <div className="flex flex-col items-center mb-4 sm:mb-0">
              <label
                htmlFor="groupIcon"
                className="relative group w-24 h-24 rounded-full overflow-hidden"
              >
                <div className="w-full h-full">
                  {groupIconPreview ? (
                    <img
                      src={groupIconPreview}
                      alt="그룹 아이콘 미리보기"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <Icons name="user" className="w-8 h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
                <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                  <Icons name="image" className="w-8 h-8 text-white" />
                </div>
              </label>
              <input
                type="file"
                id="groupIcon"
                accept="image/*"
                onChange={handleGroupIconChange}
                className="hidden"
              />
            </div>
            {/* 그룹 이름 입력 */}
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  id="groupName"
                  value={groupName}
                  placeholder=" "
                  onChange={(e) => setGroupName(e.target.value)}
                  className={baseInputClass}
                />
                <label htmlFor="groupName" className={labelClass}>
                  그룹 이름
                </label>
              </div>
            </div>
          </div>
          {/* 그룹 설명 입력 */}
          <div className="relative">
            <textarea
              id="groupDescription"
              value={groupDescription}
              onChange={(e) => setGroupDescription(e.target.value)}
              placeholder=" "
              rows={4}
              className={`${baseInputClass} resize-none`}
            ></textarea>
            <label htmlFor="groupDescription" className={labelClass}>
              그룹 설명
            </label>
          </div>
          {/* 그룹 사진 영역 */}
          <div>
            <label
              htmlFor="groupPicture"
              className="relative group block w-full h-64 rounded overflow-hidden bg-gray-200 cursor-pointer"
            >
              <div className="w-full h-full">
                {groupPicturePreview ? (
                  <img
                    src={groupPicturePreview}
                    alt="그룹 사진 미리보기"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icons name="image" className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300"></div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <Icons name="image" className="w-8 h-8 text-white" />
              </div>
            </label>
            <input
              type="file"
              id="groupPicture"
              accept="image/*"
              onChange={handleGroupPictureChange}
              className="hidden"
            />
          </div>
          {/* 공개 여부 토글 및 저장 버튼 */}
          <div className="space-y-4">
            <div>
              <span className="text-sm font-medium text-gray-700">공개 여부</span>
              <div className="mt-2">
                <label
                  htmlFor="toggleVisibility"
                  className="relative inline-flex items-center cursor-pointer"
                >
                  <input
                    type="checkbox"
                    id="toggleVisibility"
                    className="sr-only peer"
                    checked={groupVisibility === "public"}
                    onChange={(e) => setGroupVisibility(e.target.checked ? "public" : "private")}
                  />
                  <div className="w-11 h-6 bg-gray-200 rounded-full peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-gray-900">
                    {groupVisibility === "public" ? "공개" : "비공개"}
                  </span>
                </label>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
            >
              변경 사항 저장
            </button>
          </div>
        </form>
      </section>

      {/* 그룹 관리 섹션 (그룹 탈퇴) */}
      <section className="p-6 border border-gray-200 rounded shadow-sm">
        <h3 className="text-xl font-semibold mb-4">그룹 관리</h3>
        <p className="mb-4 text-gray-700">
          그룹 탈퇴 시, 그룹의 모든 채팅 기록 및 관련 데이터에 대한 접근 권한이 상실됩니다. 신중하게
          결정해 주세요.
        </p>
        <button
          onClick={handleLeaveGroup}
          className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition-colors"
        >
          그룹 탈퇴
        </button>
      </section>
    </div>
  );
};

export default GroupSettings;
