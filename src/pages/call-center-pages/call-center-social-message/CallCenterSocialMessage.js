import React, { useState } from "react";
import {
  FaTelegram,
  FaWhatsapp,
  FaInstagram,
  FaEnvelope,
  FaFacebook,
  FaLinkedin,
} from "react-icons/fa";
import { LuSend } from "react-icons/lu";
import "./callCenterSocialMessage.css";

const socialMediaPlatforms = [
  { name: "Telegram", icon: <FaTelegram color="blue" /> },
  { name: "WhatsApp", icon: <FaWhatsapp color="green" /> },
  { name: "Instagram", icon: <FaInstagram color="red" /> },
  { name: "Gmail", icon: <FaEnvelope color="grey" /> },
  { name: "Facebook", icon: <FaFacebook color="blue" /> },
  { name: "LinkedIn", icon: <FaLinkedin color="blue" /> },
];

const messagesData = {
  Telegram: [
    { id: 1, sender: "Alice", text: "Hello!", unread: true },
    { id: 2, sender: "Bob", text: "How are you?", unread: false },
  ],
  WhatsApp: [
    { id: 3, sender: "Charlie", text: "Meeting at 3 PM?", unread: true },
  ],
  Instagram: [{ id: 4, sender: "David", text: "Nice post!", unread: false }],
  Gmail: [
    {
      id: 5,
      sender: "Support",
      text: "Your ticket is resolved.",
      unread: true,
    },
  ],
};

export default function Message() {
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  return (
    <div className="message-ground">
      {/* First Column - Social Media List */}
      <div className="column">
        <h3 className="column-header">WCF Notifications</h3>
        <ul>
          {socialMediaPlatforms.map(({ name, icon }) => (
            <li
              key={name}
              className={`column-link ${
                selectedPlatform === name ? "message-active-link" : ""
              }`}
              onClick={() => {
                setSelectedPlatform(name);
                setSelectedMessage(null);
              }}
            >
              <span className="icon">{icon}</span> {name}
            </li>
          ))}
        </ul>
      </div>

      {/* Second Column - Messages */}
      <div className="column">
        <h3 className="column-header">Messages</h3>
        {selectedPlatform ? (
          <ul>
            {messagesData[selectedPlatform]?.map((msg) => (
              <li
                key={msg.id}
                className={`column-link ${
                  selectedMessage?.id === msg.id ? "message-active-link" : ""
                }`}
                onClick={() => setSelectedMessage(msg)}
              >
                <span className={msg.unread ? "font-bold" : ""}>
                  {msg.sender}: {msg.text}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p>Select a platform to see messages.</p>
        )}
      </div>

      {/* Third Column - Reply Section */}
      <div className="column">
        <h3 className="column-header">Conversation</h3>
        {selectedMessage ? (
          <div>
            <p className="mb-2">
              <strong>{selectedMessage.sender}:</strong> {selectedMessage.text}
            </p>
            <textarea
              className="message-text-area"
              rows="10"
              placeholder="Type a reply..."
            ></textarea>
            <button className="send-btn">
              <LuSend />
              Send
            </button>
          </div>
        ) : (
          <p>Select a message to reply.</p>
        )}
      </div>
    </div>
  );
}
