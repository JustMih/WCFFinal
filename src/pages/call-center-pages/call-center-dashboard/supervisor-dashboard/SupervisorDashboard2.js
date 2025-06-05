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

// Add dummy quality monitoring data
const dummyQualityData = {
  overallQualityScore: 85,
  complianceScore: 92,
  trainingNeeds: [
    {
      agentId: "AG001",
      agentName: "John Smith",
      area: "Product Knowledge",
      priority: "High",
      lastTraining: "2024-02-15"
    },
    {
      agentId: "AG002",
      agentName: "Sarah Johnson",
      area: "Call Handling",
      priority: "Medium",
      lastTraining: "2024-02-20"
    }
  ],
  recentEvaluations: [
    {
      callId: "CALL001",
      agentName: "John Smith",
      date: "2024-03-10",
      qualityScore: 88,
      complianceScore: 95,
      notes: "Good customer interaction, needs improvement in product knowledge"
    },
    {
      callId: "CALL002",
      agentName: "Sarah Johnson",
      date: "2024-03-10",
      qualityScore: 82,
      complianceScore: 90,
      notes: "Excellent compliance, could improve call resolution time"
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

// Add dummy data for quality assurance tools
const dummyQualityTools = {
  recentRecordings: [
    {
      id: "REC001",
      callId: "CALL001",
      agentName: "John Smith",
      customer: "+254 712 345 678",
      date: "2024-03-10",
      duration: "05:30",
      qualityScore: 88
    },
    {
      id: "REC002",
      callId: "CALL002",
      agentName: "Sarah Johnson",
      customer: "+254 723 456 789",
      date: "2024-03-10",
      duration: "03:45",
      qualityScore: 92
    }
  ],
  evaluationTemplates: [
    {
      id: "TEMP001",
      name: "Standard Customer Service",
      categories: ["Greeting", "Problem Resolution", "Product Knowledge", "Closing"],
      lastUpdated: "2024-03-01"
    },
    {
      id: "TEMP002",
      name: "Technical Support",
      categories: ["Technical Accuracy", "Troubleshooting", "Documentation", "Customer Education"],
      lastUpdated: "2024-03-05"
    }
  ],
  qualityTrends: {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    scores: [82, 85, 87, 84, 88, 90]
  },
  trainingRecommendations: [
    {
      agentId: "AG001",
      agentName: "John Smith",
      area: "Product Knowledge",
      priority: "High",
      reason: "Multiple product-related questions unanswered",
      recommendedTraining: "Product Update Workshop"
    },
    {
      agentId: "AG002",
      agentName: "Sarah Johnson",
      area: "Call Handling",
      priority: "Medium",
      reason: "Longer than average handle time",
      recommendedTraining: "Efficiency Techniques"
    }
  ]
};

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

// Helper function for quality score color coding
const getQualityScoreClass = (score) => {
  if (score >= 90) return 'score-excellent';
  if (score >= 80) return 'score-good';
  if (score >= 70) return 'score-fair';
  return 'score-poor';
};

// Helper function for compliance score color coding
const getComplianceScoreClass = (score) => {
  if (score >= 95) return 'score-excellent';
  if (score >= 85) return 'score-good';
  if (score >= 75) return 'score-fair';
  return 'score-poor';
};

export default function SupervisorDashboard2() {
  const [monthlyData, setMonthlyData] = useState([]);
  const [weeklyData, setWeeklyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [liveCalls, setLiveCalls] = useState(dummyLiveCalls);
  const [slaMetrics, setSlaMetrics] = useState(dummySlaMetrics);
  const [isLoading, setIsLoading] = useState(true);
  const [queueData, setQueueData] = useState(dummyQueueData);
  const [qualityData, setQualityData] = useState(dummyQualityData);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredLiveCalls, setFilteredLiveCalls] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Add new state for filters
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    agent: '',
    callType: '',
    searchQuery: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [agents, setAgents] = useState([]); // Will be populated from API
  const [alerts, setAlerts] = useState(dummyAlerts);
  const [showAlerts, setShowAlerts] = useState(true);

  // Add new state variables
  const [qualityTools, setQualityTools] = useState(dummyQualityTools);
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

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
      const liveCallsResponse = await fetch(`${baseURL}/calls/live-calls`);
      const liveCallsData = await liveCallsResponse.json();
      setLiveCalls(liveCallsData);

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
      const response = await fetch(`${baseURL}/calls/queue-status`);
      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error("Error fetching queue data:", error);
      // Keep using dummy data if API call fails
      setQueueData(dummyQueueData);
    }
  };

  // Add quality data fetching
  const fetchQualityData = async () => {
    try {
      const response = await fetch(`${baseURL}/calls/quality-metrics`);
      const data = await response.json();
      setQualityData(data);
    } catch (error) {
      console.error("Error fetching quality data:", error);
      // Keep using dummy data if API call fails
      setQualityData(dummyQualityData);
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

  // Add quality tools fetching
  const fetchQualityTools = async () => {
    try {
      const response = await fetch(`${baseURL}/quality/tools`);
      const data = await response.json();
      setQualityTools(data);
    } catch (error) {
      console.error("Error fetching quality tools:", error);
      setQualityTools(dummyQualityTools);
    }
  };

  useEffect(() => {
    fetchData();
    fetchQueueData();
    fetchQualityData();
    fetchAlerts();
    fetchQualityTools();
    const interval = setInterval(() => {
      fetchData();
      fetchQueueData();
      fetchQualityData();
      fetchAlerts();
      fetchQualityTools();
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

  // Action handlers
  const handleIntervene = (callId) => {
    console.log(`Intervening in call ${callId}`);
    // TODO: Implement intervene functionality
    alert(`Intervening in call ${callId}`);
  };

  const handleWhisper = (callId) => {
    console.log(`Whispering to call ${callId}`);
    // TODO: Implement whisper functionality
    alert(`Whispering to call ${callId}`);
  };

  const handleListen = (callId) => {
    console.log(`Listening to call ${callId}`);
    // TODO: Implement listen functionality
    alert(`Listening to call ${callId}`);
  };

  const handlePlayRecording = (recording) => {
    setSelectedRecording(recording);
    setIsPlaying(true);
    // TODO: Implement actual audio playback
    console.log(`Playing recording ${recording.id}`);
  };

  const handlePauseRecording = () => {
    setIsPlaying(false);
    // TODO: Implement actual audio pause
  };

  const handleStopRecording = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    // TODO: Implement actual audio stop
  };

  const handleTimeUpdate = (time) => {
    setCurrentTime(time);
  };

  // Add filter handlers
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

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

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      agent: '',
      callType: '',
      searchQuery: ''
    });
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

  // Add filter bar component
  const FilterBar = () => (
    <div className="filter-bar">
      <div className="filter-header">
        <h4>
          <FaFilter className="section-icon" />
          Advanced Filters
        </h4>
        <button 
          className="toggle-filters-btn"
          onClick={() => setShowFilters(!showFilters)}
        >
          {showFilters ? 'Hide Filters' : 'Show Filters'}
        </button>
      </div>

      {showFilters && (
        <form onSubmit={handleSearch} className="filter-form">
          <div className="filter-row">
            <div className="filter-group">
              <label>
                <FaCalendarAlt className="filter-icon" />
                Date Range
              </label>
              <div className="date-inputs">
                <input
                  type="date"
                  name="startDate"
                  value={filters.startDate}
                  onChange={handleFilterChange}
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  name="endDate"
                  value={filters.endDate}
                  onChange={handleFilterChange}
                  placeholder="End Date"
                />
              </div>
            </div>

            <div className="filter-group">
              <label>
                <FaUser className="filter-icon" />
                Agent
              </label>
              <select
                name="agent"
                value={filters.agent}
                onChange={handleFilterChange}
              >
                <option value="">All Agents</option>
                {agents.map(agent => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>
                <FaPhone className="filter-icon" />
                Call Type
              </label>
              <select
                name="callType"
                value={filters.callType}
                onChange={handleFilterChange}
              >
                <option value="">All Types</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
                <option value="internal">Internal</option>
              </select>
            </div>
          </div>

          <div className="filter-row">
            <div className="search-group">
              <label>
                <FaSearch className="filter-icon" />
                Search
              </label>
              <input
                type="text"
                name="searchQuery"
                value={filters.searchQuery}
                onChange={handleFilterChange}
                placeholder="Search by Call ID or Customer Number"
              />
            </div>

            <div className="filter-actions">
              <button type="submit" className="search-btn">
                <FaSearch /> Search
              </button>
              <button type="button" className="clear-btn" onClick={clearFilters}>
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );

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

  // Add template selection handler
  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="call-center-agent-container">
      <h3 className="call-center-agent-title">Supervisor Dashboard 2</h3>
      
      {/* Alerts Section */}
      {showAlerts && alerts.length > 0 && (
        <div className="alerts-section">
          <div className="alerts-header">
            <h4>
              <FaBell className="section-icon" />
              Active Alerts
            </h4>
            <button 
              className="dismiss-all-btn"
              onClick={handleDismissAllAlerts}
            >
              Dismiss All
            </button>
          </div>
          <div className="alerts-list">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`alert-item ${getAlertSeverityClass(alert.severity)}`}
              >
                <div className="alert-icon">
                  {getAlertIcon(alert.type)}
                </div>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-message">{alert.message}</span>
                    <button 
                      className="dismiss-alert-btn"
                      onClick={() => handleDismissAlert(alert.id)}
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="alert-details">
                    <span className="alert-timestamp">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                    <span className="alert-info">{alert.details}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Filter Bar */}
      <FilterBar />

      {/* Queue Monitoring Section */}
      <div className="queue-monitoring-section">
        <h4>Call Queue Monitoring</h4>
        <div className="queue-stats">
          <div className="queue-stat-card">
            <div className="queue-stat-icon">
              <FaUsers />
            </div>
            <div className="queue-stat-info">
              <span className="queue-stat-value">{queueData.totalInQueue}</span>
              <span className="queue-stat-label">Calls in Queue</span>
            </div>
          </div>
          <div className="queue-stat-card">
            <div className="queue-stat-icon">
              <FaClock />
            </div>
            <div className="queue-stat-info">
              <span className="queue-stat-value">{queueData.averageWaitTime}</span>
              <span className="queue-stat-label">Avg Wait Time</span>
            </div>
          </div>
          <div className="queue-stat-card">
            <div className="queue-stat-icon">
              <FaExclamationTriangle />
            </div>
            <div className="queue-stat-info">
              <span className="queue-stat-value">{queueData.priorityCalls}</span>
              <span className="queue-stat-label">Priority Calls</span>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="waiting-calls-table">
            <thead>
              <tr>
                <th>Queue ID</th>
                <th>Customer</th>
                <th>Wait Time</th>
                <th>Priority</th>
                <th>Call Type</th>
              </tr>
            </thead>
            <tbody>
              {queueData.waitingCalls.map((call) => (
                <tr key={call.id}>
                  <td className="queue-id">{call.id}</td>
                  <td className="customer-number">{call.customer}</td>
                  <td>
                    <span className={`wait-time-badge ${getWaitTimeClass(call.waitTime)}`}>
                      {call.waitTime}
                    </span>
                  </td>
                  <td>
                    <span className={`priority-badge ${call.priority.toLowerCase()}`}>
                      {call.priority}
                    </span>
                  </td>
                  <td className="call-type">{call.callType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SLA Metrics Cards */}
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

      {/* Live Calls Table */}
      <div className="live-calls-table-container">
        <div className="live-calls-header">
          <h4>Live Calls {isLoading && <span className="loading-indicator">(Loading...)</span>}</h4>
          <div className="live-calls-actions">
            <div className="search-box">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search calls..."
                value={searchTerm}
                onChange={handleSearch}
                className="search-input"
              />
            </div>
            <button className="export-btn" onClick={handleExport}>
              <FaFileExport /> Export
            </button>
          </div>
        </div>
        <div className="table-responsive">
          <table className="live-calls-table">
            <thead>
              <tr>
                <th>Call ID</th>
                <th>Agent</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Queue Time</th>
                <th>Call Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getPaginatedData().map((call) => (
                <tr key={call.id}>
                  <td className="call-id">{call.id}</td>
                  <td className="agent-name">{call.agent}</td>
                  <td className="customer-number">{call.customer}</td>
                  <td>
                    <span className={`status-badge ${call.status.toLowerCase()}`}>
                      {call.status}
                    </span>
                  </td>
                  <td>
                    <span className={`duration-badge ${getDurationColorClass(call.duration)}`}>
                      {call.duration}
                    </span>
                  </td>
                  <td className="queue-time">{call.queueTime}</td>
                  <td className="call-type">{call.callType}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-button listen"
                        onClick={() => handleListen(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Listen"
                      >
                        <FaHeadphones />
                      </button>
                      <button
                        className="action-button intervene"
                        onClick={() => handleIntervene(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Intervene"
                      >
                        <FaUserShield />
                      </button>
                      <button
                        className="action-button whisper"
                        onClick={() => handleWhisper(call.id)}
                        disabled={call.status === "COMPLETED"}
                        title="Whisper"
                      >
                        <FaComments />
                      </button>
                      {call.status === "COMPLETED" && (
                        <button
                          className="action-button play"
                          onClick={() => handlePlayRecording(call)}
                          title="Play Recording"
                        >
                          <FaPlay />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <div className="pagination-info">
              Page {currentPage} of {totalPages}
            </div>
            <button
              className="pagination-btn"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Quality Monitoring Section */}
      <div className="quality-monitoring-section">
        <h4>Quality Monitoring</h4>
        
        {/* Quality Score Cards */}
        <div className="quality-stats">
          <div className="quality-stat-card">
            <div className="quality-stat-icon">
              <FaChartLine />
            </div>
            <div className="quality-stat-info">
              <span className="quality-stat-value">{qualityData.overallQualityScore}%</span>
              <span className="quality-stat-label">Overall Quality Score</span>
            </div>
          </div>
          <div className="quality-stat-card">
            <div className="quality-stat-icon">
              <FaClipboardCheck />
            </div>
            <div className="quality-stat-info">
              <span className="quality-stat-value">{qualityData.complianceScore}%</span>
              <span className="quality-stat-label">Compliance Score</span>
            </div>
          </div>
        </div>

        {/* Training Needs Section */}
        <div className="training-needs-section">
          <h5>
            <FaGraduationCap className="section-icon" />
            Training Needs
          </h5>
          <div className="table-responsive">
            <table className="training-needs-table">
              <thead>
                <tr>
                  <th>Agent ID</th>
                  <th>Agent Name</th>
                  <th>Area</th>
                  <th>Priority</th>
                  <th>Last Training</th>
                </tr>
              </thead>
              <tbody>
                {qualityData.trainingNeeds.map((need) => (
                  <tr key={need.agentId}>
                    <td className="agent-id">{need.agentId}</td>
                    <td className="agent-name">{need.agentName}</td>
                    <td className="training-area">{need.area}</td>
                    <td>
                      <span className={`priority-badge ${need.priority.toLowerCase()}`}>
                        {need.priority}
                      </span>
                    </td>
                    <td className="last-training">{need.lastTraining}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Evaluations */}
        <div className="recent-evaluations-section">
          <h5>
            <FaCheckCircle className="section-icon" />
            Recent Evaluations
          </h5>
          <div className="table-responsive">
            <table className="evaluations-table">
              <thead>
                <tr>
                  <th>Call ID</th>
                  <th>Agent</th>
                  <th>Date</th>
                  <th>Quality Score</th>
                  <th>Compliance</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {qualityData.recentEvaluations.map((evaluation) => (
                  <tr key={evaluation.callId}>
                    <td className="call-id">{evaluation.callId}</td>
                    <td className="agent-name">{evaluation.agentName}</td>
                    <td className="evaluation-date">{evaluation.date}</td>
                    <td>
                      <span className={`quality-score ${getQualityScoreClass(evaluation.qualityScore)}`}>
                        {evaluation.qualityScore}%
                      </span>
                    </td>
                    <td>
                      <span className={`compliance-score ${getComplianceScoreClass(evaluation.complianceScore)}`}>
                        {evaluation.complianceScore}%
                      </span>
                    </td>
                    <td className="evaluation-notes">{evaluation.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Quality Assurance Tools Section */}
      <div className="quality-assurance-section">
        <h4>
          <FaHeadphones className="section-icon" />
          Quality Assurance Tools
        </h4>

        <div className="quality-tools-grid">
          {/* Call Recording Playback */}
          <div className="recording-playback-card">
            <h5>Call Recording Playback</h5>
            {selectedRecording ? (
              <div className="recording-player">
                <div className="recording-info">
                  <span className="recording-agent">{selectedRecording.agentName}</span>
                  <span className="recording-customer">{selectedRecording.customer}</span>
                  <span className="recording-date">{selectedRecording.date}</span>
                </div>
                <div className="playback-controls">
                  <button 
                    className="playback-btn"
                    onClick={isPlaying ? handlePauseRecording : handlePlayRecording}
                  >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                  </button>
                  <button 
                    className="playback-btn"
                    onClick={handleStopRecording}
                  >
                    <FaStop />
                  </button>
                  <div className="playback-progress">
                    <div 
                      className="progress-bar"
                      style={{ width: `${(currentTime / selectedRecording.duration) * 100}%` }}
                    />
                  </div>
                  <span className="playback-time">
                    {currentTime} / {selectedRecording.duration}
                  </span>
                </div>
              </div>
            ) : (
              <div className="recordings-list">
                {qualityTools.recentRecordings.map(recording => (
                  <div 
                    key={recording.id}
                    className="recording-item"
                    onClick={() => handlePlayRecording(recording)}
                  >
                    <div className="recording-details">
                      <span className="recording-agent">{recording.agentName}</span>
                      <span className="recording-customer">{recording.customer}</span>
                      <span className="recording-date">{recording.date}</span>
                    </div>
                    <div className="recording-metrics">
                      <span className="recording-duration">{recording.duration}</span>
                      <span className={`quality-score ${getQualityScoreClass(recording.qualityScore)}`}>
                        {recording.qualityScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evaluation Templates */}
          <div className="evaluation-templates-card">
            <h5>Evaluation Templates</h5>
            <div className="templates-list">
              {qualityTools.evaluationTemplates.map(template => (
                <div 
                  key={template.id}
                  className={`template-item ${selectedTemplate?.id === template.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <div className="template-header">
                    <span className="template-name">{template.name}</span>
                    <span className="template-date">Updated: {template.lastUpdated}</span>
                  </div>
                  <div className="template-categories">
                    {template.categories.map((category, index) => (
                      <span key={index} className="category-tag">{category}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quality Score Trends */}
          <div className="quality-trends-card">
            <h5>Quality Score Trends</h5>
            <div className="trends-chart">
              <Line
                data={{
                  labels: qualityTools.qualityTrends.labels,
                  datasets: [{
                    label: 'Quality Score',
                    data: qualityTools.qualityTrends.scores,
                    borderColor: '#1890ff',
                    tension: 0.4,
                    fill: false
                  }]
                }}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: false,
                      min: 70,
                      max: 100
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Training Recommendations */}
          <div className="training-recommendations-card">
            <h5>Training Recommendations</h5>
            <div className="recommendations-list">
              {qualityTools.trainingRecommendations.map(recommendation => (
                <div key={recommendation.agentId} className="recommendation-item">
                  <div className="recommendation-header">
                    <span className="agent-name">{recommendation.agentName}</span>
                    <span className={`priority-badge ${recommendation.priority.toLowerCase()}`}>
                      {recommendation.priority}
                    </span>
                  </div>
                  <div className="recommendation-details">
                    <div className="recommendation-area">
                      <strong>Area:</strong> {recommendation.area}
                    </div>
                    <div className="recommendation-reason">
                      <strong>Reason:</strong> {recommendation.reason}
                    </div>
                    <div className="recommendation-training">
                      <strong>Recommended Training:</strong> {recommendation.recommendedTraining}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 