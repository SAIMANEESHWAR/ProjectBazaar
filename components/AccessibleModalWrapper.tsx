import React from 'react';
import { createPortal } from 'react-dom';
import { useAccessibleModal } from '../hooks/useAccessibleModal';

interface AccessibleModalWrapperProps {
  isOpen: boolean;
  onClose: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Drop-in wrapper that adds focus trap, Escape-to-close, scroll lock,
 * focus restore, and proper ARIA attributes to any modal overlay.
 *
 * Usage:
 * <AccessibleModalWrapper isOpen={isOpen} onClose={onClose} ariaLabel="Edit project">
 *   <div className="fixed inset-0 bg-black/50 ...">
 *     <div className="modal-content ...">...</div>
 *   </div>
 * </AccessibleModalWrapper>
 */
const AccessibleModalWrapper: React.FC<AccessibleModalWrapperProps> = ({
  isOpen,
  onClose,
  ariaLabel,
  children,
  className = '',
}) => {
  const modalRef = useAccessibleModal(isOpen, onClose);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </div>,
    document.body
  );
};

export default AccessibleModalWrapper;
