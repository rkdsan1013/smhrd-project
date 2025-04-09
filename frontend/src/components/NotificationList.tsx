// File: /frontend/src/components/NotificationList.tsx

import React, { useEffect, useState } from "react";
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

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  const renderNotificationItem = (notification: Notification) => {
    switch (notification.type) {
      case "groupInvite":
        return (
          <div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">{notification.sender}</span> 님이 그룹{" "}
              <span className="font-semibold">{notification.groupName}</span>에 초대했습니다.
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => acceptNotification(notification.id, notification.type)}
                className="px-4 py-2 bg-blue-500 rounded-lg text-white text-sm hover:bg-blue-600 transition-colors duration-300"
              >
                수락
              </button>
              <button
                onClick={() => declineNotification(notification.id, notification.type)}
                className="px-4 py-2 bg-red-500 rounded-lg text-white text-sm hover:bg-red-600 transition-colors duration-300"
              >
                거절
              </button>
            </div>
          </div>
        );
      case "friendRequest":
        return (
          <div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">{notification.sender}</span> 님이 친구 요청을
              보냈습니다.
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => acceptNotification(notification.id, notification.type)}
                className="px-4 py-2 bg-blue-500 rounded-lg text-white text-sm hover:bg-blue-600 transition-colors duration-300"
              >
                수락
              </button>
              <button
                onClick={() => declineNotification(notification.id, notification.type)}
                className="px-4 py-2 bg-red-500 rounded-lg text-white text-sm hover:bg-red-600 transition-colors duration-300"
              >
                거절
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
              className="px-3 py-1 bg-gray-300 rounded-lg text-xs hover:bg-gray-400 transition-colors duration-300"
            >
              닫기
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
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">알림</h2>
          <button
            onClick={handleClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <div className="p-6 max-h-80 overflow-y-auto no-scrollbar">
          {notifications.length > 0 ? (
            <ul className="space-y-4">
              {notifications.map((notification) => (
                <li key={notification.id} className="p-3 rounded-lg bg-gray-100">
                  {renderNotificationItem(notification)}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-600">새로운 알림이 없습니다.</p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default NotificationList;
