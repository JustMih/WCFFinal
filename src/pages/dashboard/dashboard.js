import React, { useState, useRef, useEffect, use } from "react";
import Card from "../../components/card/card";
import {
  MdOutlineSupportAgent,
  MdCloudQueue,
  MdOutlineLocalPhone,
  MdOutlineEmail,
  MdOutlinePhoneInTalk,
} from "react-icons/md";
import { VscRefresh } from "react-icons/vsc";
import { CiNoWaitingSign } from "react-icons/ci";
import { TiTickOutline } from "react-icons/ti";
import { FiPhoneIncoming } from "react-icons/fi";
import { TbPhoneCheck, TbPhoneX } from "react-icons/tb";
import { HiPhoneOutgoing, HiOutlineMailOpen } from "react-icons/hi";
import { BsCollection } from "react-icons/bs";
import { UserAgent } from "sip.js"; // Correct SIP.js import
import { RiMailUnreadLine } from "react-icons/ri";
import { baseURL } from "../../config";
import { FaEraser } from "react-icons/fa";
import {
  IoLogoWhatsapp,
  IoMdLogIn,
  IoMdCloseCircleOutline,
} from "react-icons/io";
import { CgUnavailable } from "react-icons/cg";
import { FaHandHolding } from "react-icons/fa";
import { FaPersonWalkingArrowRight } from "react-icons/fa6";
import CallChart from "../../components/call-chart/call-chart";
import "./dashboard.css";

const Dashboard = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false); // State to control dropdown visibility
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 }); // State for dropdown position
  const [phoneNumber, setPhoneNumber] = useState(""); // State to store the dialed number
  const [callStatus, setCallStatus] = useState(""); // State to track call status
  const [agentActivites, setAgentActivities] = useState(""); // State to store agent activities
  const [sipClient, setSipClient] = useState(null);
  const [loginTime, setLoginTime] = useState("");
  const [sipSession, setSipSession] = useState(null); // State to store SIP.js session

  const buttonRef = useRef(null); // Ref for the phone button

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
  const userId = localStorage.getItem("userId");

  // Function to open dropdown and position it below the button
  const toggleDropdown = () => {
    if (buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: buttonRect.bottom + window.scrollY + 10,
        left: buttonRect.left + window.scrollX,
      });
    }
    setDropdownOpen((prev) => !prev);
  };

  // Function to initialize the SIP client
  // Function to initialize SIP client
  const initializeSIPClient = () => {
    const configuration = {
      uri: "sip:1004@10.52.0.19",
      // wsServers: ["ws://10.52.0.19:8088"], // Ensure the WebSocket URL is correct
      traceSip: true,
      authorizationUser: "1004",
      password: "sip12345",
    };

    console.log(
      "WebSocket URL before initialization:",
      configuration.wsServers
    );

    // Check if the WebSocket URL is valid before proceeding
    if (
      !configuration.wsServers ||
      configuration.wsServers.length === 0 ||
      !configuration.wsServers[0]
    ) {
      console.error("Invalid or empty WebSocket URL");
      return;
    }

    const userAgent = new UserAgent(configuration);
    setSipClient(userAgent);

    userAgent.on("registered", () => {
      console.log("SIP Client registered with Asterisk");
    });

    userAgent.on("unregistered", () => {
      console.log("SIP Client unregistered");
    });

    userAgent.on("registrationFailed", (error) => {
      console.error("Registration failed:", error);
    });

    return userAgent;
  };

  // Fetch the login time of the agent
  useEffect(() => {
    if (role === "agent" && userId) {
      getAgentLoginTime();
      const userAgent = initializeSIPClient();

      // Cleanup on component unmount
      return () => {
        if (userAgent) {
          userAgent.stop();
        }
      };
    }
  }, [role, userId]);

  const getAgentLoginTime = async () => {
    try {
      const response = await fetch(`${baseURL}/auth/login-time`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();
      if (response.ok) {
        // Format the login time to get only the time part
        const time = new Date(data.loginTime).toLocaleTimeString(); // Get only time (e.g., "7:33:05 AM")
        setLoginTime(time); // Set the formatted time
      } else {
        console.error("Failed to fetch login time:", data.message);
      }
    } catch (error) {
      console.error("Error fetching login time:", error);
    }
  };

  // Handle the call initiation
  const handleCall = async () => {
    if (!phoneNumber) {
      setCallStatus("Please enter a phone number.");
      return;
    }

    try {
      const session = sipClient.invite(`sip:${phoneNumber}@10.52.0.19`, {
        media: {
          constraints: { audio: true },
          render: { remote: document.getElementById("remoteAudio") },
        },
      });
      setSipSession(session);
      setCallStatus("Call initiated.");
      session.on("accepted", () => {
        setCallStatus("Call accepted.");
      });
      session.on("terminated", () => {
        setCallStatus("Call terminated.");
      });
    } catch (error) {
      setCallStatus(`Error: ${error.message}`);
    }
  };

  // Handle number input for the dialer
  const handleDialButton = (digit) => {
    setPhoneNumber(phoneNumber + digit);
  };

  // Handle eraser button
  const handleEraser = () => {
    setPhoneNumber(phoneNumber.slice(0, -1));
  };

  return (
    <div className="p-6">
      {role === "agent" ? (
        <div className="agent-body">
          <h3>Agent</h3>
          {/* Phone Icon to trigger the modal */}
          <div className="phone-navbar">
            {/* phone icon here */}
            <MdOutlineLocalPhone
              className="phone-btn-call"
              ref={buttonRef} // Attach ref to button
              onClick={toggleDropdown}
            />
            {/* mode status here */}
            <div className="call-status">
              {agentActivites === "Ready" ? (
                <TiTickOutline style={{ fontSize: "30px", color: "green" }} />
              ) : (
                <CgUnavailable style={{ fontSize: "30px", color: "red" }} />
              )}
              {/* Add dropdown for status */}
              <select
                value={agentActivites}
                onChange={(e) => setAgentActivities(e.target.value)}
                className="status-dropdown"
              >
                <option value="Ready">Ready</option>
                <option value="Breakfast">Breakfast</option>
                <option value="Lunch">Lunch</option>
              </select>
            </div>
          </div>
          <div className="dashboard-single-agent">
            <div className="single-agent-card">
              <div className="single-agent-head">
                <FiPhoneIncoming fontSize={15} />
                In-Bound Calls
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <FiPhoneIncoming fontSize={15} color="green" />
                  Calls
                </div>
                20
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <TbPhoneCheck fontSize={15} />
                  Answered
                </div>
                10
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <TbPhoneX fontSize={15} color="red" />
                  Dropped
                </div>
                20
              </div>
            </div>
            <div className="single-agent-card">
              <div className="single-agent-head">
                <HiPhoneOutgoing fontSize={15} />
                Out-Bound Calls
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <FiPhoneIncoming fontSize={15} color="green" />
                  Calls
                </div>
                20
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <TbPhoneCheck fontSize={15} />
                  Answered
                </div>
                10
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <TbPhoneX fontSize={15} color="red" />
                  Dropped
                </div>
                20
              </div>
            </div>
            <div className="single-agent-card">
              <div className="single-agent-head">
                <MdOutlineEmail fontSize={15} />
                Emails
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <BsCollection fontSize={15} color="green" />
                  Total
                </div>
                20
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <HiOutlineMailOpen fontSize={15} />
                  Opened
                </div>
                10
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <RiMailUnreadLine fontSize={15} color="red" />
                  Closed
                </div>
                20
              </div>
            </div>
            <div className="single-agent-card">
              <div className="single-agent-head">
                <IoLogoWhatsapp fontSize={15} color="green" />
                Whatsapp
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <BsCollection fontSize={15} color="green" />
                  Total
                </div>
                20
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <HiOutlineMailOpen fontSize={15} />
                  Opened
                </div>
                10
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <RiMailUnreadLine fontSize={15} color="red" />
                  Closed
                </div>
                20
              </div>
            </div>
          </div>
          <div className="dashboard-single-agent-row_two">
            <div className="login-summary">
              <div className="login-summary-title">
                <IoMdLogIn />
                <h4>Login Summary</h4>
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <CiNoWaitingSign fontSize={20} color="red" />
                  Idle Time
                </div>
                00:03:34
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <MdOutlinePhoneInTalk fontSize={20} color="green" />
                  Talk Time
                </div>
                00:03:34
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <FaHandHolding fontSize={20} color="black" />
                  Hold Time
                </div>
                00:03:34
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <IoMdCloseCircleOutline fontSize={20} color="red" />
                  Break Time
                </div>
                00:03:34
              </div>
              <div className="single-agent-level">
                <div className="single-agent-level-left">
                  <FaPersonWalkingArrowRight fontSize={20} color="green" />
                  Last Login Time
                </div>
                {loginTime || "Loading..."}
              </div>
            </div>
            <div className="chat">
              {/* simple chat here */}
              <CallChart />
            </div>
          </div>
          {/* Call Status Display */}
          <div className="call-status-display">
            {callStatus && <p>{callStatus}</p>}
          </div>
          {/* Dropdown will be shown if dropdownOpen is true */}
          {dropdownOpen && (
            <div
              className="phone-dropdown"
              style={{
                top: `${dropdownPosition.top}px`,
                left: `${dropdownPosition.left}px`,
              }}
            >
              <div className="phone-dropdown-content">
                <div className="keypad-container">
                  <input
                    type="text"
                    className="dial-input"
                    placeholder="Dial number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                  <div className="keypad">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, "*", 0, "#"].map((digit) => (
                      <button
                        key={digit}
                        onClick={() => handleDialButton(digit)}
                      >
                        {digit}
                      </button>
                    ))}
                    <button
                      style={{ backgroundColor: "green" }}
                      onClick={handleCall}
                    >
                      OK
                    </button>
                    <button onClick={handleEraser}>
                      <FaEraser />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
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
