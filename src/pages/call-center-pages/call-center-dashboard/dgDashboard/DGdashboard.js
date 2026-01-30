import React, { useEffect, useState } from "react";
import { Bar, Line } from "react-chartjs-2";
import ReactApexChart from "react-apexcharts";
import { baseURL } from "../../../../config";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title as ChartTitle,
  Tooltip as ChartTooltip,
  Legend,
} from "chart.js";
import {
  MdPhone,
  MdPhoneDisabled,
  MdCallEnd,
  MdTrendingUp,
} from "react-icons/md";
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Tabs, Tab } from "@mui/material";
import AgentDashboard from "../../../crm-pages/crm-dashboard/crm-agent-dashboard/crm-agent-dashboard";
import "./dgDashboard.css";

// Register chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ChartTitle,
  ChartTooltip,
  Legend
);

// TabPanel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`dg-tabpanel-${index}`}
      aria-labelledby={`dg-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function DGdashboard() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [totalCounts, setTotalCounts] = useState([]);
  const [monthlyCounts, setMonthlyCounts] = useState([]);
  const [dailyCounts, setDailyCounts] = useState([]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Calculate totals and percentages
  const yearlyTotal = totalCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const monthlyTotal = monthlyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );
  const dailyTotal = dailyCounts.reduce(
    (sum, item) => sum + (item.count || 0),
    0
  );

  const getCount = (counts, disposition) =>
    counts.find((i) => i.disposition === disposition)?.count || 0;

  const yearlyAnswered = getCount(totalCounts, "ANSWERED");
  const yearlyNoAnswer = getCount(totalCounts, "NO ANSWER");
  const yearlyBusy = getCount(totalCounts, "BUSY");

  const monthlyAnswered = getCount(monthlyCounts, "ANSWERED");
  const monthlyNoAnswer = getCount(monthlyCounts, "NO ANSWER");
  const monthlyBusy = getCount(monthlyCounts, "BUSY");

  const dailyAnswered = getCount(dailyCounts, "ANSWERED");
  const dailyNoAnswer = getCount(dailyCounts, "NO ANSWER");
  const dailyBusy = getCount(dailyCounts, "BUSY");

  const calculatePercentage = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/calls/calls-count`);
        const data = await response.json();
        setTotalCounts(data.totalCounts || []);
        setMonthlyCounts(data.monthlyCounts || []);
        setDailyCounts(data.dailyCounts || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Helper function to format dates safely
  const formatDate = (dateValue, index) => {
    if (!dateValue) {
      // If no date, use index-based label
      return `Day ${index + 1}`;
    }
    try {
      // Try to parse the date
      let date;
      if (typeof dateValue === 'string') {
        // Handle different date formats
        if (dateValue.includes('T')) {
          date = new Date(dateValue);
        } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateValue + 'T00:00:00');
        } else {
          date = new Date(dateValue);
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) {
        // If date is still invalid, return formatted string or index
        return dateValue.toString() || `Day ${index + 1}`;
      }
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      // Fallback to index-based label
      return `Day ${index + 1}`;
    }
  };

  const formatMonthDate = (dateValue, index) => {
    if (!dateValue) {
      return `Month ${index + 1}`;
    }
    try {
      let date;
      if (typeof dateValue === 'string') {
        if (dateValue.includes('T')) {
          date = new Date(dateValue);
        } else if (dateValue.match(/^\d{4}-\d{2}$/)) {
          // Handle YYYY-MM format
          date = new Date(dateValue + '-01T00:00:00');
        } else if (dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateValue + 'T00:00:00');
        } else {
          date = new Date(dateValue);
        }
      } else if (dateValue instanceof Date) {
        date = dateValue;
      } else {
        date = new Date(dateValue);
      }

      if (isNaN(date.getTime())) {
        return dateValue.toString() || `Month ${index + 1}`;
      }
      
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      return `Month ${index + 1}`;
    }
  };

  // ApexCharts area chart data for Daily, Monthly, and Yearly trends
  const areaChartCategories = [
    // Daily labels
    ...(dailyCounts.length > 0
      ? dailyCounts.map((d, index) => {
          const dateValue = d.date || d.day || d.date_time || d.created_at || d.timestamp;
          return formatDate(dateValue, index);
        })
      : []),
    // Monthly labels
    ...(monthlyCounts.length > 0
      ? monthlyCounts.map((d, index) => {
          const dateValue = d.month || d.date || d.date_time || d.created_at || d.timestamp;
          return formatMonthDate(dateValue, index);
        })
      : []),
    // Yearly label
    "Yearly Total",
  ];

  const areaChartSeries = [
    {
      name: "Daily Total Calls",
        data: [
        ...(dailyCounts.length > 0
          ? dailyCounts.map((d) => {
              const answered = getCount([d], "ANSWERED");
              const noAnswer = getCount([d], "NO ANSWER");
              const busy = getCount([d], "BUSY");
              return answered + noAnswer + busy;
            })
          : []),
        ...Array(monthlyCounts.length).fill(null),
        yearlyTotal,
      ],
    },
    {
      name: "Daily Answered",
        data: [
        ...(dailyCounts.length > 0
          ? dailyCounts.map((d) => getCount([d], "ANSWERED"))
          : []),
        ...Array(monthlyCounts.length).fill(null),
        null,
      ],
    },
    {
      name: "Monthly Total Calls",
        data: [
        ...Array(dailyCounts.length).fill(null),
        ...(monthlyCounts.length > 0
          ? monthlyCounts.map((d) => {
              const answered = getCount([d], "ANSWERED");
              const noAnswer = getCount([d], "NO ANSWER");
              const busy = getCount([d], "BUSY");
              return answered + noAnswer + busy;
            })
          : []),
        null,
      ],
    },
    {
      name: "Monthly Answered",
        data: [
        ...Array(dailyCounts.length).fill(null),
        ...(monthlyCounts.length > 0
          ? monthlyCounts.map((d) => getCount([d], "ANSWERED"))
          : []),
        null,
      ],
    },
    {
      name: "Yearly Total",
        data: [
        ...Array(dailyCounts.length).fill(null),
        ...Array(monthlyCounts.length).fill(null),
        yearlyTotal,
      ],
    },
  ];

  const areaChartOptions = {
    chart: {
      type: "area",
      height: 300,
      toolbar: {
        show: true,
      },
      zoom: {
        enabled: false,
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
      width: [2.5, 2, 2.5, 2, 3],
      dashArray: [0, 0, 5, 5, 0],
    },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3,
        stops: [0, 90, 100],
      },
    },
    colors: [
      "rgb(75, 192, 192)",
      "rgb(76, 175, 80)",
      "rgb(102, 126, 234)",
      "rgb(76, 175, 80)",
      "rgb(156, 39, 176)",
    ],
    xaxis: {
      categories: areaChartCategories,
      labels: {
        rotate: -45,
        rotateAlways: true,
        style: {
          fontSize: "10px",
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Calls",
      },
      labels: {
        formatter: function (val) {
          return Math.round(val);
        },
      },
    },
                legend: {
      position: "top",
      horizontalAlign: "left",
      fontSize: "11px",
                },
                tooltip: {
      shared: true,
      intersect: false,
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 1,
    },
  };

  // Radial chart options for call status distribution
  const radialChartOptions = {
    chart: {
      type: "radialBar",
      height: 350,
    },
    plotOptions: {
      radialBar: {
        hollow: {
          size: "70%",
        },
        dataLabels: {
          name: {
            fontSize: "16px",
            color: "#666",
          },
          value: {
            fontSize: "24px",
            fontWeight: 600,
            color: "#333",
          },
          total: {
            show: true,
            label: "Total Calls",
            fontSize: "16px",
            fontWeight: 600,
            color: "#666",
            formatter: function () {
              return yearlyTotal;
            },
          },
        },
      },
    },
    labels: ["Answered", "No Answer", "Busy"],
    colors: ["#4caf50", "#ff9800", "#f44336"],
                legend: {
      show: true,
      floating: false,
      fontSize: "14px",
                  position: "bottom",
      labels: {
        useSeriesColors: true,
      },
      formatter: function (seriesName, opts) {
        return seriesName + ": " + opts.w.globals.series[opts.seriesIndex];
      },
    },
    title: {
      text: "Call Status Distribution (Yearly)",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const radialChartSeries = [
    yearlyAnswered,
    yearlyNoAnswer,
    yearlyBusy,
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <div className="dg-dashboard-container">
      <Box sx={{ p: 3 }}>
        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            aria-label="director general dashboard tabs"
          >
            <Tab label="Dashboard" />
            <Tab label="CRM Dashboard" />
          </Tabs>
        </Box>

        {/* Tab Panel for Dashboard */}
        <TabPanel value={activeTab} index={0}>
          {/* 4 Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3, display: 'flex', width: '100%' }}>
          {/* Card 1: Total Calls */}
          <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdPhone size={20} style={{ color: "#667eea" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Total Calls
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#667eea", mb: 1.5, fontSize: "1.25rem" }}>
                  {yearlyTotal.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                      {monthlyTotal.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, fontSize: "0.7rem" }}>
                      {dailyTotal.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 2: Answered Calls */}
          <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdPhone size={20} style={{ color: "#4caf50" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Answered Calls
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#4caf50", mb: 1.5, fontSize: "1.25rem" }}>
                  {yearlyAnswered.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {monthlyAnswered.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {dailyAnswered.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {calculatePercentage(yearlyAnswered, yearlyTotal)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: No Answer Calls */}
          <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdPhoneDisabled size={20} style={{ color: "#ff9800" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    No Answer Calls
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9800", mb: 1.5, fontSize: "1.25rem" }}>
                  {yearlyNoAnswer.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {monthlyNoAnswer.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {dailyNoAnswer.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {calculatePercentage(yearlyNoAnswer, yearlyTotal)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Busy Calls */}
          <Grid item xs={12} sm={6} md={3} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdCallEnd size={20} style={{ color: "#f44336" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Busy Calls
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#f44336", mb: 1.5, fontSize: "1.25rem" }}>
                  {yearlyBusy.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#f44336", fontSize: "0.7rem" }}>
                      {monthlyBusy.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#f44336", fontSize: "0.7rem" }}>
                      {dailyBusy.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#f44336", fontSize: "0.7rem" }}>
                      {calculatePercentage(yearlyBusy, yearlyTotal)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={3}>
          {/* Combined Daily, Monthly, and Yearly Trend Line Chart */}
          <Grid item xs={12} lg={8} sx={{ width: '70%' }}>
            <Card sx={{ width: '100%', height: '100%' }}>
              <CardContent sx={{ width: '70%', p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                  Call Trend (Daily, Monthly & Yearly)
                </Typography>
                <Box sx={{ width: '100%', height: '300px', maxHeight: '300px', position: 'relative' }}>
                  <ReactApexChart
                    options={areaChartOptions}
                    series={areaChartSeries}
                    type="area"
                    height={300}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Radial Chart */}
          <Grid item xs={12} lg={3}>
            <Card>
              <CardContent>
                <ReactApexChart
                  options={radialChartOptions}
                  series={radialChartSeries}
                  type="radialBar"
                  height={350}
                />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        </TabPanel>

        {/* Tab Panel for CRM Dashboard */}
        <TabPanel value={activeTab} index={1}>
          <AgentDashboard />
        </TabPanel>
      </Box>
    </div>
  );
}
