import React, { useState, useEffect } from "react";
import { Line } from "react-chartjs-2";
import { baseURL } from "../../../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { 
  FaHeadphones, 
  FaUserShield, 
  FaComments,
  FaClock,
  FaUsers,
  FaExclamationTriangle,
  FaPlay,
  FaCheckCircle,
  FaGraduationCap,
  FaChartLine,
  FaClipboardCheck,
  FaUserGraduate,
  FaSearch,
  FaFilter,
  FaCalendarAlt,
  FaUser,
  FaPhone,
  FaFileExport,
  FaBell,
  FaTimes,
  FaUserClock,
  FaChartBar,
  FaExclamationCircle,
  FaServer,
  FaPause,
  FaStop
} from "react-icons/fa";
import "./supervisorDashboard.css";
import LiveCallsCard from "../../../../components/supervisor-dashboard/LiveCallsCard";
import CallQueueCard from "../../../../components/supervisor-dashboard/CallQueueCard";
import ActiveCalls from "../../../../components/active-calls/ActiveCalls";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Dummy data for development
const dummyLiveCalls = [
  {
    id: "CALL001",
    agent: "John Smith",
    customer: "+254 712 345 678",
    status: "ACTIVE",
    duration: "01:45",
    queueTime: "00:15",
    callType: "Inbound"
  },
  {
    id: "CALL002",
    agent: "Sarah Johnson",
    customer: "+254 723 456 789",
    status: "QUEUED",
    duration: "00:00",
    queueTime: "00:05",
    callType: "Inbound"
  },
  {
    id: "CALL003",
    agent: "Mike Brown",
    customer: "+254 734 567 890",
    status: "ACTIVE",
    duration: "05:30",
    queueTime: "00:10",
    callType: "Outbound"
  },
  {
    id: "CALL004",
    agent: "Lisa Wang",
    customer: "+254 745 678 901",
    status: "ACTIVE",
    duration: "03:15",
    queueTime: "00:20",
    callType: "Inbound"
  },
  {
    id: "CALL005",
    agent: "David Kim",
    customer: "+254 756 789 012",
    status: "COMPLETED",
    duration: "02:45",
    queueTime: "00:08",
    callType: "Outbound"
  }
];

const dummySlaMetrics = {
  averageResponseTime: 15,
  averageHandleTime: 180,
  serviceLevel: 85,
  abandonmentRate: 5
};

// Add dummy queue data
const dummyQueueData = {
  totalInQueue: 8,
  averageWaitTime: "02:15",
  longestWait: "05:30",
  priorityCalls: 2,
  waitingCalls: [
    {
      id: "Q001",
      customer: "+254 712 345 678",
      waitTime: "00:45",
      priority: "High",
      callType: "Inbound"
    },
    {
      id: "Q002",
      customer: "+254 723 456 789",
      waitTime: "01:15",
      priority: "Normal",
      callType: "Inbound"
    },
    {
      id: "Q003",
      customer: "+254 734 567 890",
      waitTime: "02:30",
      priority: "High",
      callType: "Inbound"
    }
  ]
};

// Add dummy alerts data
const dummyAlerts = [
  {
    id: 1,
    type: 'wait-time',
    severity: 'high',
    message: 'Queue wait time exceeds 5 minutes',
    timestamp: new Date().toISOString(),
    details: '3 calls waiting longer than 5 minutes'
  },
  {
    id: 2,
    type: 'performance',
    severity: 'medium',
    message: 'Agent performance below target',
    timestamp: new Date().toISOString(),
    details: 'John Smith: 65% FCR (Target: 80%)'
  },
  {
    id: 3,
    type: 'sla',
    severity: 'high',
    message: 'SLA breach detected',
    timestamp: new Date().toISOString(),
    details: 'Service level at 75% (Target: 85%)'
  },
  {
    id: 4,
    type: 'system',
    severity: 'low',
    message: 'System maintenance scheduled',
    timestamp: new Date().toISOString(),
    details: 'Scheduled for 2:00 AM EST'
  }
];

// Helper function for wait time color coding
const getWaitTimeClass = (waitTime) => {
  const [minutes, seconds] = waitTime.split(':').map(Number);
  const totalMinutes = minutes + (seconds / 60);

  if (totalMinutes < 2) {
    return 'wait-time-normal';
  } else if (totalMinutes < 4) {
    return 'wait-time-warning';
  } else {
    return 'wait-time-critical';
  }
};

// Helper function for queue call status
const getQueueCallStatus = (call) => {
  // Simulate status based on wait time for demo
  const [min, sec] = call.waitTime.split(':').map(Number);
  const totalSeconds = min * 60 + sec;
  if (totalSeconds < 60) return 'Active';
  if (totalSeconds < 120) return 'Dropped';
  return 'Lost';
};

export default function SupervisorDashboard2() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [liveCalls, setLiveCalls] = useState(dummyLiveCalls);
  const [slaMetrics, setSlaMetrics] = useState(dummySlaMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [queueData, setQueueData] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLiveCalls, setFilteredLiveCalls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add new state for filters
  const [showAlerts, setShowAlerts] = useState(false);
  const [alerts, setAlerts] = useState(dummyAlerts);

  // Fetch data from the API
  const fetchData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${baseURL}/calls/calls-count`);
      const data = await response.json();
      setMonthlyData(data.monthlyCounts);
      setWeeklyData(data.weeklyCounts);
      setDailyData(data.dailyCounts);
      
      // Fetch live calls data
      const liveCallsResponse = await fetch(`${baseURL}/livestream/live-calls`);
      if (liveCallsResponse.ok) {
        const liveCallsData = await liveCallsResponse.json();
        setLiveCalls(liveCallsData);
      }

      // Fetch SLA metrics
      const slaResponse = await fetch(`${baseURL}/calls/sla-metrics`);
      const slaData = await slaResponse.json();
      setSlaMetrics(slaData);
    } catch (error) {
      console.error("Error fetching data:", error);
      // Keep using dummy data if API calls fail
      setLiveCalls(dummyLiveCalls);
      setSlaMetrics(dummySlaMetrics);
    } finally {
      setIsLoading(false);
    }
  };

  // Add queue data fetching
  const fetchQueueData = async () => {
    try {
      const response = await fetch(`${baseURL}/queue-call-stats`);
      if (!response.ok) throw new Error('Failed to fetch queue data');
      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Error fetching queue data:', error);
      setQueueData(null);
    }
  };

  // Add alert fetching
  const fetchAlerts = async () => {
    try {
      const response = await fetch(`${baseURL}/alerts/active`);
      const data = await response.json();
      setAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      // Keep using dummy data if API call fails
      setAlerts(dummyAlerts);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQueueData();
    fetchAlerts();
    const interval = setInterval(() => {
      fetchData();
      fetchQueueData();
      fetchAlerts();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Function to determine duration color class
  const getDurationColorClass = (duration) => {
    const [minutes, seconds] = duration.split(':').map(Number);
    const totalMinutes = minutes + (seconds / 60);

    if (totalMinutes < 2) {
      return 'duration-green';
    } else if (totalMinutes < 5) {
      return 'duration-yellow';
    } else {
      return 'duration-red';
    }
  };

  // Line chart data for trend analysis
  const lineData = {
    labels: ["Answered", "Busy", "No Answer"],
    datasets: [
      {
        label: "Monthly Trend",
        data: [
          monthlyData.find((item) => item.disposition === "ANSWERED")?.count || 0,
          monthlyData.find((item) => item.disposition === "BUSY")?.count || 0,
          monthlyData.find((item) => item.disposition === "NO ANSWER")?.count || 0,
        ],
        borderColor: "rgb(75, 192, 192)",
        tension: 0.1,
      },
    ],
  };

  // Add filter handlers
  const handleSearch = (e) => {
    const searchValue = e.target.value.toLowerCase();
    setSearchTerm(searchValue);
    
    const filtered = liveCalls.filter(call => 
      call.id.toLowerCase().includes(searchValue) ||
      call.agent.toLowerCase().includes(searchValue) ||
      call.customer.toLowerCase().includes(searchValue) ||
      call.callType.toLowerCase().includes(searchValue)
    );
    setFilteredLiveCalls(filtered);
  };

  // Add export handler
  const handleExport = () => {
    const dataToExport = filteredLiveCalls.length > 0 ? filteredLiveCalls : liveCalls;
    const csvContent = [
      // Headers
      ['Call ID', 'Agent', 'Customer', 'Status', 'Duration', 'Queue Time', 'Call Type'].join(','),
      // Data rows
      ...dataToExport.map(call => [
        call.id,
        call.agent,
        call.customer,
        call.status,
        call.duration,
        call.queueTime,
        call.callType
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `live_calls_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Update useEffect to initialize filteredLiveCalls
  useEffect(() => {
    setFilteredLiveCalls(liveCalls);
  }, [liveCalls]);

  // Add pagination handlers
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Calculate pagination
  const getPaginatedData = () => {
    const data = filteredLiveCalls.length > 0 ? filteredLiveCalls : liveCalls;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil((filteredLiveCalls.length > 0 ? filteredLiveCalls : liveCalls).length / itemsPerPage);

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Add alert handlers
  const handleDismissAlert = (alertId) => {
    setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
  };

  const handleDismissAllAlerts = () => {
    setAlerts([]);
  };

  // Helper function to get alert icon
  const getAlertIcon = (type) => {
    switch (type) {
      case 'wait-time':
        return <FaUserClock />;
      case 'performance':
        return <FaChartBar />;
      case 'sla':
        return <FaExclamationCircle />;
      case 'system':
        return <FaServer />;
      default:
        return <FaBell />;
    }
  };

  // Helper function to get alert severity class
  const getAlertSeverityClass = (severity) => {
    switch (severity) {
      case 'high':
        return 'alert-high';
      case 'medium':
        return 'alert-medium';
      case 'low':
        return 'alert-low';
      default:
        return '';
    }
  };

  return (
    <div className="call-center-agent-container">
        <h3 className="call-center-agent-title">Supervisor Dashboard 2</h3>

      {/* Queue Monitoring Section */}
      <div className="dashboard-single-agent">
          <CallQueueCard />
        </div>
      
      {/* Active Calls Section */}
      {/* <ActiveCalls liveCalls={liveCalls} refreshInterval={5000} showTitle={true} /> */}
      
      {/* Live Calls Table */}
      <div className="live-calls-table-container">
      <LiveCallsCard />
      </div>
         {/* SLA Metrics Cards */}
         <div className="live-calls-table-container">
        <div className="call-center-agent-summary">
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {slaMetrics.serviceLevel}%
              </p>
            </div>
            <h4>Service Level</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {slaMetrics.averageResponseTime}s
              </p>
            </div>
            <h4>Avg Response Time</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {slaMetrics.averageHandleTime}s
              </p>
            </div>
            <h4>Avg Handle Time</h4>
          </div>
        </div>
        <div className="call-center-agent-card">
          <div className="call-center-agent-card-icon">
            <div className="call-center-agent-data">
              <p className="call-center-agent-value">
                {slaMetrics.abandonmentRate}%
              </p>
            </div>
            <h4>Abandonment Rate</h4>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
} 