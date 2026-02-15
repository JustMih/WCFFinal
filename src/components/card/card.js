import React from "react";
import "./card.css"; // Import the CSS for styling

const Card = ({ title, data, color, icon }) => {
  return (
    <div className="card">
      <div className="card-header">
        {icon}
        <h4>{title}</h4>
      </div>
      <div className="card-body" style={{ backgroundColor: color }}>
        <div className="card-data">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="data-item">
              <h4>{key}</h4>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
      {/* <div className="summary">
        <h4>Total</h4>30
      </div> */}
    </div>
  );
};

export default Card;
