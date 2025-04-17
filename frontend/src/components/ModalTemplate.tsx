// /frontend/src/components/ModalTemplate.tsx

import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import Icons from "./Icons";

interface ModalTemplateProps {
  onClose: () => void;
}

const ModalTemplate: React.FC<ModalTemplateProps> = ({ onClose }) => {
  const [isVisible, setIsVisible] = useState(false);

  // 모달 열릴 때 fade‑in 효과 적용
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 모달 닫기: fade‑out 효과 후 onClose 호출
  const handleModalClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return ReactDOM.createPortal(
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Background Overlay with fade effect */}
      <div
        className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      ></div>

      {/* Modal Container with fade effect */}
      <div
        className={`relative bg-white rounded-lg shadow-xl w-96 transition-opacity duration-300 ${
          isVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">Modal Header</h2>
          <button
            onClick={handleModalClose}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-300 transition-colors duration-300"
          >
            <Icons name="close" className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6">
          <p>This is a placeholder for modal content.</p>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => console.log("Temporary Cancel action")}
              className="h-10 w-full bg-gray-300 rounded-lg hover:bg-gray-400 transition-colors duration-300"
            >
              <span className="text-gray-800 text-sm">Cancel</span>
            </button>
            <button
              onClick={() => console.log("Temporary Confirm action")}
              className="h-10 w-full bg-green-500 rounded-lg hover:bg-green-600 transition-colors duration-300"
            >
              <span className="text-white text-sm">Confirm</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ModalTemplate;
