import React from "react";
import "./info-card.css";

const InfoCard = ({ count, title, icon }) => {
  return (
    <div className="info-card">
      <div className="info-top">
        <span className="count">{count}</span>
        <div className="icon">{icon}</div>
      </div>
      <span className="title">{title}</span>
    </div>
  );
};

export default InfoCard;
