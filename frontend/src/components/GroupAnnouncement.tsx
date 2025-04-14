import React, { useState, useEffect } from "react";
import {
  createAnnouncement,
  getAnnouncements,
  deleteAnnouncement,
  Announcement,
} from "../services/groupService";
import Icons from "./Icons";

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
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  const handleCreateAnnouncement = async () => {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요.");
      return;
    }
    setError(null);
    try {
      const newAnnouncement = await createAnnouncement(groupUuid, title, content);
      setAnnouncements((prev) => [
        {
          ...newAnnouncement,
          author_name: newAnnouncement.author_name || "리더",
          created_at: newAnnouncement.created_at || new Date().toISOString(),
          updated_at: newAnnouncement.updated_at || new Date().toISOString(),
        },
        ...prev,
      ]);
      setTitle("");
      setContent("");
      setIsFormOpen(false);
    } catch (err: any) {
      setError("공지사항 등록에 실패했습니다.");
      console.error("[GroupAnnouncement] 생성 실패:", err.message);
    }
  };

  const handleDeleteAnnouncement = async (announcementUuid: string) => {
    if (!confirm("이 공지사항을 삭제하시겠습니까?")) return;
    try {
      await deleteAnnouncement(groupUuid, announcementUuid);
      setAnnouncements((prev) => prev.filter((ann) => ann.uuid !== announcementUuid));
      setError(null);
    } catch (err: any) {
      setError("공지사항 삭제에 실패했습니다.");
      console.error("[GroupAnnouncement] 삭제 실패:", err.message);
    }
  };

  if (loading) {
    return <div className="text-center text-gray-500">로딩 중...</div>;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <h2 className="text-2xl font-bold mb-4">공지사항</h2>

      {isLeader && (
        <div className="mb-6">
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-all duration-200"
          >
            {isFormOpen ? "취소" : "공지사항 등록"}
          </button>
          {isFormOpen && (
            <div className="mt-4 p-4 bg-gray-100 rounded">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="제목"
                className="w-full p-2 mb-2 border rounded"
                maxLength={100}
              />
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="내용"
                className="w-full p-2 mb-2 border rounded"
                rows={4}
              />
              {error && <p className="text-red-500 mb-2">{error}</p>}
              <button
                onClick={handleCreateAnnouncement}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition-all duration-200"
              >
                등록
              </button>
            </div>
          )}
        </div>
      )}

      {announcements.length === 0 ? (
        <p className="text-gray-500">공지사항이 없습니다.</p>
      ) : (
        <ul className="space-y-4">
          {announcements.map((announcement) => (
            <li key={announcement.uuid} className="p-4 bg-white rounded shadow">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Icons name="bell" className="w-6 h-6 mr-2 text-yellow-500" />
                  <h3 className="text-lg font-semibold">{announcement.title}</h3>
                </div>
                {isLeader && (
                  <button
                    onClick={() => handleDeleteAnnouncement(announcement.uuid)}
                    className="bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 transition-all duration-200"
                  >
                    삭제
                  </button>
                )}
              </div>
              <p className="text-gray-700">{announcement.content}</p>
              <p className="text-sm text-gray-500 mt-2">
                작성자: {announcement.author_name} | 작성일:{" "}
                {new Date(announcement.created_at).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default GroupAnnouncement;
