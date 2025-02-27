import React, { useState } from "react";
import { FaPhoneAlt } from "react-icons/fa"; // Phone icon
import Card from "../../components/card/card";
import { MdOutlineSupportAgent, MdCloudQueue } from "react-icons/md";
import { VscRefresh } from "react-icons/vsc";
import { CiNoWaitingSign } from "react-icons/ci";
import Modal from "./phone-modal"; // Import Modal component
import "./dashboard.css";

const Dashboard = () => {
  const [modalOpen, setModalOpen] = useState(false); // State to control modal visibility

  const agentActivity = {
    Talking: 0,
    Idle: 3,
    Mission: 0,
    Pause: 0,
    Total: 3,
  };

  const queueActivity = {
    Incoming: 109,
    Outgoing: 0,
    "In/Hour": 9,
    "Out/Hour": 0,
    Total: 109,
  };

  const waitingCalls = {
    "Top Waiting": "00:00",
    "Waiting Avg": "00:41",
    "Max Wait": "06:03",
    Callbacks: 10732,
    Total: 0,
  };

  const abandonedCalls = {
    "Last Hour": 5,
    "Waiting Avg": "01:07",
    "Max Wait": "04:19",
    "% / Calls": 14,
    Total: 16,
  };

  const role = localStorage.getItem("role");

  return (
    <div className="p-6">
      {role === "agent" ? (
        <>
          {/* agent call here */}
          <h3>Agent</h3>
          {/* Phone Icon to trigger the modal */}
          <div className="navbar">
            <FaPhoneAlt
              onClick={() => setModalOpen(true)}
              style={{ cursor: "pointer", fontSize: "30px" }}
            />
          </div>

          {/* Modal will be shown if modalOpen is true */}
          {modalOpen && <Modal closeModal={() => setModalOpen(false)} />}
        </>
      ) : (
        <>
          <h3 className="title">Dashboard</h3>
          <div className="dashboard">
            <div className="cards-container">
              <Card
                className="card-dashboard"
                title="Agent Activity"
                data={agentActivity}
                color="#bce8be"
                icon={<MdOutlineSupportAgent fontSize={35} />}
              />
              <Card
                title="Queue Activity"
                data={queueActivity}
                color="#ceedea"
                icon={<MdCloudQueue fontSize={35} />}
              />
            </div>
            <div className="cards-container">
              <Card
                title="Waiting Calls"
                data={waitingCalls}
                color="#ebca9b"
                icon={<VscRefresh fontSize={35} />}
              />
              <Card
                title="Abandoned Calls"
                data={abandonedCalls}
                color="#d99a96"
                icon={<CiNoWaitingSign fontSize={35} />}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
