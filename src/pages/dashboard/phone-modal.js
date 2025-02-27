import React from "react";

const Modal = ({ closeModal, position }) => {
  return (
    <div className="phone-modal-overlay" onClick={closeModal}>
      <div
        className="phone-modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ top: `${position.top}px`, left: `${position.left}px` }} // Apply position dynamically
      >
        <h2>Best Virtual Dialer & Phone System</h2>
        <p>Here you can make calls, transfer calls, and perform other tasks.</p>
        <div className="phone-phone-actions">
          <button onClick={closeModal}>Mute</button>
          <button onClick={closeModal}>Hold</button>
          <button onClick={closeModal}>Start Recording</button>
        </div>
        <button onClick={closeModal}>Close</button>
      </div>
    </div>
  );
};

export default Modal;
