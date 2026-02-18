import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'md' | 'lg' | 'xl' | '2xl';
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClass = {
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[size];

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className={`bg-white rounded-2xl shadow-glass-lg w-full ${sizeClass} animate-scaleIn border border-secondary-100`}>
        <div className="flex items-center justify-between p-5 border-b border-secondary-100">
          <h3 className="text-lg font-bold text-secondary-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-secondary-400 hover:text-secondary-600 hover:bg-secondary-100 p-1.5 rounded-lg transition-all duration-200"
            aria-label="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-5 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
        {footer && (
          <div className="p-5 border-t border-secondary-100 flex justify-end space-x-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
