// /frontend/src/components/GroupAnnouncement.tsx

import React, { useState, useEffect } from "react";
import { getAnnouncements, deleteAnnouncement, Announcement } from "../services/groupService";
import Icons from "./Icons";
import GroupAnnouncementModal from "./GroupAnnouncementModal";

interface GroupAnnouncementProps {
  groupUuid: string;
  currentUserUuid: string;
  groupLeaderUuid: string;
}

const GroupAnnouncement: React.FC<GroupAnnouncementProps> = ({
  groupUuid,
  currentUserUuid,
  groupLeaderUuid,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isLeader = currentUserUuid === groupLeaderUuid;

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        const data = await getAnnouncements(groupUuid);
        setAnnouncements(data.announcements);
      } catch (err: any) {
        setError("공지사항을 불러오지 못했습니다.");
        console.error("[GroupAnnouncement] 조회 실패:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
  }, [groupUuid]);

  const handleDeleteAnnouncement = async (announcementUuid: string) => {
    if (!window.confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await deleteAnnouncement(groupUuid, announcementUuid);
      setAnnouncements((prev) => prev.filter((ann) => ann.uuid !== announcementUuid));
      setError(null);
    } catch (err: any) {
      setError("공지사항 삭제에 실패했습니다.");
      console.error("[GroupAnnouncement] 삭제 실패:", err.message);
    }
  };

  const refreshAnnouncements = async () => {
    try {
      const data = await getAnnouncements(groupUuid);
      setAnnouncements(data.announcements);
    } catch (err: any) {
      console.error("[GroupAnnouncement] 리프레시 실패:", err.message);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500 py-10">로딩 중...</div>;
  }

  return (
    // 기존의 h-screen 대신 부모 컨테이너에 맞게 h-full 사용
    <div className="h-full flex flex-col bg-gray-50">
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800">그룹 공지사항</h2>
        {isLeader && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-all duration-200"
          >
            공지사항 등록
          </button>
        )}
      </header>
      {error && <p className="text-center text-red-500 my-4">{error}</p>}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-center">등록된 공지사항이 없습니다.</p>
        ) : (
          <div className="space-y-6">
            {announcements.map((announcement) => (
              <div
                key={announcement.uuid}
                className="p-6 bg-white rounded-lg border border-gray-200 shadow hover:shadow-lg transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <Icons name="bell" className="w-7 h-7 text-yellow-500 mr-3" />
                    <h3 className="text-xl font-bold text-gray-800">{announcement.title}</h3>
                  </div>
                  {isLeader && (
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.uuid)}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-all duration-200"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <p className="text-gray-700 mb-3">{announcement.content}</p>
                <div className="text-sm text-gray-500">
                  <span className="mr-4">작성자: {announcement.author_name}</span>
                  <span>작성일: {new Date(announcement.created_at).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {isModalOpen && (
        <GroupAnnouncementModal
          groupUuid={groupUuid}
          onClose={() => {
            setIsModalOpen(false);
            refreshAnnouncements();
          }}
        />
      )}
    </div>
  );
};

export default GroupAnnouncement;
