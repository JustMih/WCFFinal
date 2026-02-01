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
  MdAssignment,
  MdPending,
  MdCheckCircle,
  MdWarning,
  MdTrendingUp,
} from "react-icons/md";
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from "@mui/material";
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

export default function DGdashboardticket() {
  const [loading, setLoading] = useState(true);
  const [ticketSummary, setTicketSummary] = useState(null);

  // Extract data from ticket summary
  const stats = ticketSummary?.stats || {};
  const totalTickets = stats.totalTickets || 0;
  const openTickets = stats.openTickets || 0;
  const inProgressTickets = stats.inProgressTickets || 0;
  const resolvedTickets = stats.resolvedTickets || 0;
  const overdueTickets = stats.overdueTickets || 0;

  // Extract and format date range
  const dateRange = ticketSummary?.dateRange || {};
  const formatDateRange = (dateString) => {
    if (!dateString) return "";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return dateString;
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${day} ${month} ${year}`;
    } catch (error) {
      return dateString;
    }
  };
  const startDate = formatDateRange(dateRange.startDate);
  const endDate = formatDateRange(dateRange.endDate);

  // Get status distribution from API response
  const statusDistribution = ticketSummary?.statusDistribution?.data || [];
  const getStatusCount = (status) => {
    const item = statusDistribution.find((s) => s.status === status);
    return item?.count || 0;
  };

  // Calculate monthly and daily totals from trends
  const monthlyTrends = ticketSummary?.trends?.monthly || [];
  const dailyTrends = ticketSummary?.trends?.daily || [];

  const monthlyTotal = monthlyTrends.reduce((sum, item) => sum + (item.count || 0), 0);
  const dailyTotal = dailyTrends.reduce((sum, item) => sum + (item.count || 0), 0);

  // For monthly and daily breakdowns, calculate based on percentages
  const getPercentage = (value, total) => total > 0 ? value / total : 0;
  
  const monthlyOpen = Math.round(monthlyTotal * getPercentage(openTickets, totalTickets)) || 0;
  const monthlyInProgress = Math.round(monthlyTotal * getPercentage(inProgressTickets, totalTickets)) || 0;
  const monthlyResolved = Math.round(monthlyTotal * getPercentage(resolvedTickets, totalTickets)) || 0;

  const dailyOpen = Math.round(dailyTotal * getPercentage(openTickets, totalTickets)) || 0;
  const dailyInProgress = Math.round(dailyTotal * getPercentage(inProgressTickets, totalTickets)) || 0;
  const dailyResolved = Math.round(dailyTotal * getPercentage(resolvedTickets, totalTickets)) || 0;

  const calculatePercentage = (count, total) => {
    if (!total || total === 0) return 0;
    return ((count / total) * 100).toFixed(1);
  };

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${baseURL}/ticket-summary/ticket-summary`);
        const data = await response.json();
        setTicketSummary(data);
      } catch (error) {
        console.error("Error fetching ticket data:", error);
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
      
      // Format as "DD MMM" (e.g., "31 Jan")
      const day = date.getDate();
      const month = date.toLocaleDateString("en-US", { month: "short" });
      return `${day} ${month}`;
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
      
      // Format as "MMM YYYY" (e.g., "Jan 2026")
      const month = date.toLocaleDateString("en-US", { month: "short" });
      const year = date.getFullYear();
      return `${month} ${year}`;
    } catch (error) {
      return `Month ${index + 1}`;
    }
  };

  // ApexCharts area chart data for Daily, Monthly, and Yearly trends
  const yearlyTrends = ticketSummary?.trends?.yearly || [];

  // Group daily trends into date ranges: 1-10, 11-20, 21-end of month
  const groupDailyByDateRanges = (dailyData) => {
    const grouped = {};
    
    dailyData.forEach((d) => {
      if (d.date) {
        try {
          const date = new Date(d.date);
          if (!isNaN(date.getTime())) {
            const day = date.getDate();
            const month = date.getMonth() + 1;
            const year = date.getFullYear();
            const daysInMonth = new Date(year, month, 0).getDate();
            
            // Determine which range the day falls into
            let rangeKey, rangeLabel;
            if (day >= 1 && day <= 10) {
              rangeKey = `${year}-${String(month).padStart(2, '0')}-1-10`;
              rangeLabel = `1-10 ${date.toLocaleDateString("en-US", { month: "short" })}`;
            } else if (day >= 11 && day <= 20) {
              rangeKey = `${year}-${String(month).padStart(2, '0')}-11-20`;
              rangeLabel = `11-20 ${date.toLocaleDateString("en-US", { month: "short" })}`;
            } else if (day >= 21) {
              rangeKey = `${year}-${String(month).padStart(2, '0')}-21-${daysInMonth}`;
              rangeLabel = `21-${daysInMonth} ${date.toLocaleDateString("en-US", { month: "short" })}`;
            } else {
              return; // Skip invalid days
            }
            
            if (!grouped[rangeKey]) {
              grouped[rangeKey] = {
                label: rangeLabel,
                count: 0,
                month: month,
                year: year,
                sortKey: `${year}-${String(month).padStart(2, '0')}-${rangeKey.split('-')[2]}`
              };
            }
            grouped[rangeKey].count += d.count || 0;
          }
        } catch (error) {
          console.error("Error grouping daily data:", error);
        }
      }
    });
    
    // Convert to array and sort by date
    return Object.values(grouped).sort((a, b) => {
      return a.sortKey.localeCompare(b.sortKey);
    });
  };

  const groupedDailyRanges = groupDailyByDateRanges(dailyTrends);

  const areaChartCategories = [
    // Daily range labels (1-10, 11-20, 21-end)
    ...(groupedDailyRanges.length > 0
      ? groupedDailyRanges.map((d) => d.label)
      : []),
    // Monthly labels from API
    ...(monthlyTrends.length > 0
      ? monthlyTrends.map((d, index) => {
          const dateValue = d.year && d.month ? `${d.year}-${String(d.month).padStart(2, '0')}` : null;
          return formatMonthDate(dateValue, index);
        })
      : []),
    // Yearly label
    ...(yearlyTrends.length > 0
      ? yearlyTrends.map((d) => `${d.year} Total`)
      : ["Yearly Total"]),
  ];

  const areaChartSeries = [
    {
      name: "Daily Total Tickets",
      data: [
        ...(groupedDailyRanges.length > 0
          ? groupedDailyRanges.map((d) => d.count || 0)
          : []),
        ...Array(monthlyTrends.length).fill(null),
        ...(yearlyTrends.length > 0 ? [totalTickets] : [null]),
      ],
    },
    {
      name: "Daily Open",
      data: [
        ...(groupedDailyRanges.length > 0
          ? groupedDailyRanges.map((d) => Math.round((d.count || 0) * getPercentage(openTickets, totalTickets)) || 0)
          : []),
        ...Array(monthlyTrends.length).fill(null),
        ...(yearlyTrends.length > 0 ? [null] : [null]),
      ],
    },
    {
      name: "Monthly Total Tickets",
      data: [
        ...Array(groupedDailyRanges.length).fill(null),
        ...(monthlyTrends.length > 0
          ? monthlyTrends.map((d) => d.count || 0)
          : []),
        ...(yearlyTrends.length > 0 ? [null] : [null]),
      ],
    },
    {
      name: "Monthly Resolved",
      data: [
        ...Array(groupedDailyRanges.length).fill(null),
        ...(monthlyTrends.length > 0
          ? monthlyTrends.map((d) => Math.round((d.count || 0) * getPercentage(resolvedTickets, totalTickets)) || 0)
          : []),
        ...(yearlyTrends.length > 0 ? [null] : [null]),
      ],
    },
    {
      name: "Yearly Total",
      data: [
        ...Array(groupedDailyRanges.length).fill(null),
        ...Array(monthlyTrends.length).fill(null),
        ...(yearlyTrends.length > 0 ? [totalTickets] : [null]),
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
          fontWeight: 500,
        },
        maxHeight: 80,
        formatter: function (value) {
          // Keep the formatted value as is
          return value;
        },
      },
    },
    yaxis: {
      title: {
        text: "Number of Tickets",
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
      fontSize: "10px",
      itemMargin: {
        horizontal: 8,
        vertical: 4,
      },
      onItemClick: {
        toggleDataSeries: true,
      },
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

  // Radial chart options for ticket status distribution
  const radialChartOptions = {
    chart: {
      type: "radialBar",
      height: 350,
      toolbar: {
        show: false,
      },
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
            label: "Total Tickets",
            fontSize: "16px",
            fontWeight: 600,
            color: "#666",
            formatter: function () {
              return totalTickets;
            },
          },
        },
      },
    },
    labels: statusDistribution.map((s) => s.status || "Unknown"),
    colors: ["#4caf50", "#ff9800", "#2196f3", "#f44336", "#9c27b0"],
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
      text: "Ticket Status Distribution",
      align: "center",
      style: {
        fontSize: "16px",
        fontWeight: 600,
      },
    },
  };

  const radialChartSeries = statusDistribution.map((s) => s.count || 0);

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
        {/* 5 Stat Cards */}
        <Grid container spacing={2} sx={{ mb: 3, display: 'flex', width: '100%' }}>
          {/* Card 1: Total Tickets */}
          <Grid item xs={12} sm={6} md={2.4} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdAssignment size={20} style={{ color: "#667eea" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Total Tickets
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#667eea", mb: 1.5, fontSize: "1.25rem" }}>
                  {totalTickets.toLocaleString()}
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

          {/* Card 2: Open Tickets */}
          <Grid item xs={12} sm={6} md={2.4} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdPending size={20} style={{ color: "#2196f3" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Open Tickets
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#2196f3", mb: 1.5, fontSize: "1.25rem" }}>
                  {openTickets.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#2196f3", fontSize: "0.7rem" }}>
                      {monthlyOpen.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#2196f3", fontSize: "0.7rem" }}>
                      {dailyOpen.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#2196f3", fontSize: "0.7rem" }}>
                      {calculatePercentage(openTickets, totalTickets)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 3: In Progress Tickets */}
          <Grid item xs={12} sm={6} md={2.4} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdTrendingUp size={20} style={{ color: "#ff9800" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    In Progress
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#ff9800", mb: 1.5, fontSize: "1.25rem" }}>
                  {inProgressTickets.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {monthlyInProgress.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {dailyInProgress.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#ff9800", fontSize: "0.7rem" }}>
                      {calculatePercentage(inProgressTickets, totalTickets)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 4: Resolved Tickets */}
          <Grid item xs={12} sm={6} md={2.4} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdCheckCircle size={20} style={{ color: "#4caf50" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Resolved
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#4caf50", mb: 1.5, fontSize: "1.25rem" }}>
                  {resolvedTickets.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Monthly:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {monthlyResolved.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Daily:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {dailyResolved.toLocaleString()}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#4caf50", fontSize: "0.7rem" }}>
                      {calculatePercentage(resolvedTickets, totalTickets)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Card 5: Overdue Tickets */}
          <Grid item xs={12} sm={6} md={2.4} sx={{ flex: 1, minWidth: 0 }}>
            <Card className="stat-card stat-card-small">
              <CardContent sx={{ p: "16px !important" }}>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MdWarning size={20} style={{ color: "#f44336" }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
                    Overdue
                  </Typography>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: "#f44336", mb: 1.5, fontSize: "1.25rem" }}>
                  {overdueTickets.toLocaleString()}
                </Typography>
                <Box sx={{ borderTop: "1px solid #e0e0e0", pt: 1 }}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="caption" color="textSecondary" sx={{ fontSize: "0.7rem" }}>
                      Percentage:
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: "#f44336", fontSize: "0.7rem" }}>
                      {calculatePercentage(overdueTickets, totalTickets)}%
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Charts Section */}
        <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ width: '100%', margin: 0, display: 'flex', flexWrap: 'nowrap' }}>
          {/* Combined Daily, Monthly, and Yearly Trend Line Chart */}
          <Grid item xs={12} sm={8} md={8} lg={8} sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Card sx={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <CardContent sx={{ width: '100%', p: { xs: 1.5, sm: 2, md: 2 }, boxSizing: 'border-box' }}>
                <Typography 
                  variant="h6" 
                  gutterBottom 
                  sx={{ 
                    mb: { xs: 1.5, sm: 2 }, 
                    fontWeight: 600,
                    fontSize: { xs: '0.9rem', sm: '1rem', md: '1.1rem' }
                  }}
                >
                  Ticket Trend (Daily, Monthly & Yearly)
                </Typography>
                <Box sx={{ 
                  width: '100%', 
                  height: { xs: '250px', sm: '280px', md: '300px' }, 
                  maxHeight: '300px', 
                  position: 'relative',
                  overflow: 'hidden',
                  boxSizing: 'border-box'
                }}>
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
          <Grid item xs={12} sm={4} md={4} lg={4} sx={{ flex: '1 1 auto', minWidth: 0 }}>
            <Card sx={{ width: '100%', height: '100%', boxSizing: 'border-box' }}>
              <CardContent sx={{ width: '100%', p: { xs: 1.5, sm: 2, md: 2 }, boxSizing: 'border-box' }}>
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
      </Box>
    </div>
  );
}
