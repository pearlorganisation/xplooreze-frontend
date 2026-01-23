import React, { useEffect, useRef } from "react";
import ReactDOM from 'react-dom';
import './ConfirmDialog.css';

export default function ConfirmDialog({
  isOpen,
  title = "Confirm",
  message = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmColor = "#2563eb", // default blue
  onConfirm = () => {},
  onCancel = () => {},
  closeOnBackdrop = true,
}) {
  const overlayRef = useRef(null);
  const confirmRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocused.current = document.activeElement;
    requestAnimationFrame(() => {
      confirmRef.current?.focus();
    });

    function onKeyDown(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      }
      if (e.key === "Tab") {
        const focusable = overlayRef.current.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
      previouslyFocused.current?.focus?.();
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  function onBackdropClick(e) {
    if (!closeOnBackdrop) return;
    if (e.target === overlayRef.current) onCancel();
  }

  return ReactDOM.createPortal(
    (
      <div
        ref={overlayRef}
        className="cd-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cd-title"
        aria-describedby="cd-message"
        onMouseDown={onBackdropClick}
      >
        <div className="cd-panel" onMouseDown={(e) => e.stopPropagation()}>
          <h2 id="cd-title" className="cd-title">
            {title}
          </h2>
          <div id="cd-message" className="cd-message">
            {message}
          </div>
          <div className="cd-actions">
            <button
              ref={confirmRef}
              className="cd-btn cd-btn-confirm"
              style={{ backgroundColor: confirmColor }}
              onClick={onConfirm}
            >
              {confirmText}
            </button>
            <button className="cd-btn cd-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    ),
    document.body
  );
}
