// /frontend/src/components/NotificationList.tsx

import React, { useEffect, useState, useRef, useLayoutEffect } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";
import { useNotificationContext, Notification } from "../contexts/NotificationContext";

interface NotificationListProps {
  onClose: () => void;
}

const NotificationList: React.FC<NotificationListProps> = ({ onClose }) => {
  const { notifications, acceptNotification, declineNotification, removeNotification } =
    useNotificationContext();
  const [isVisible, setIsVisible] = useState(false);

  // containerRef: 높이 조절 및 스크롤용, contentRef: 내부 콘텐츠
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 내부 콘텐츠의 scrollHeight를 기준으로 컨테이너 높이를 동적으로 설정
  useLayoutEffect(() => {
    const MAX_HEIGHT_PX = 400;
    if (containerRef.current && contentRef.current) {
      const contentHeight = contentRef.current.scrollHeight;
      const newHeight = contentHeight > MAX_HEIGHT_PX ? MAX_HEIGHT_PX : contentHeight;
      containerRef.current.style.transition = "height 0.3s ease-in-out";
      containerRef.current.style.height = `${newHeight / 16}rem`;
      containerRef.current.style.overflowY = contentHeight > MAX_HEIGHT_PX ? "auto" : "hidden";
    }
  }, [notifications]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const commonButtonClasses =
    "p-2 rounded hover:bg-gray-100 transition-colors duration-200 transform active:scale-95";

  const renderNotificationItem = (notification: Notification) => {
    switch (notification.type) {
      case "groupInvite":
        return (
          <div>
            <div className="mb-2 text-gray-800 font-medium">
              <span className="text-lg">{notification.groupName}</span> 그룹에 초대되었습니다.
            </div>
            <div className="mb-2 text-gray-600">
              보낸사람: <span className="font-semibold">{notification.sender}</span>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => acceptNotification(notification.id, notification.type)}
                className={`${commonButtonClasses} group`}
              >
                <Icons name="check" className="w-6 h-6 text-green-500 group-hover:text-green-600" />
              </button>
              <button
                onClick={() => declineNotification(notification.id, notification.type)}
                className={`${commonButtonClasses} group`}
              >
                <Icons name="close" className="w-6 h-6 text-red-500 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        );
      case "friendRequest":
        return (
          <div>
            <div className="mb-2 text-gray-800 font-medium">
              <span className="font-semibold">{notification.sender}</span> 님이 친구 요청을
              보냈습니다.
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => acceptNotification(notification.id, notification.type)}
                className={`${commonButtonClasses} group`}
              >
                <Icons name="check" className="w-6 h-6 text-green-500 group-hover:text-green-600" />
              </button>
              <button
                onClick={() => declineNotification(notification.id, notification.type)}
                className={`${commonButtonClasses} group`}
              >
                <Icons name="close" className="w-6 h-6 text-red-500 group-hover:text-red-600" />
              </button>
            </div>
          </div>
        );
      case "chatMessage":
        return (
          <div className="flex justify-between items-center">
            <div className="text-gray-700">
              <strong>{notification.sender}</strong>: {notification.message}
            </div>
            <button
              onClick={() => removeNotification(notification.id)}
              className={commonButtonClasses}
            >
              <Icons name="close" className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return ReactDOM.createPortal(
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">알림</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-200 transform active:scale-95"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        {/* Body */}
        <div ref={containerRef} className="overflow-hidden no-scrollbar">
          <div ref={contentRef} className="p-6">
            {notifications.length > 0 ? (
              <ul className="space-y-4">
                {notifications.map((notification) => (
                  <li
                    key={`${notification.type}-${notification.id}`}
                    className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-300 shadow-sm"
                  >
                    {renderNotificationItem(notification)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600">새로운 알림이 없습니다.</p>
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 text-right">
          <button
            onClick={() => console.log("임시 버튼 클릭")}
            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 transform active:scale-95"
          >
            임시 버튼
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NotificationList;
