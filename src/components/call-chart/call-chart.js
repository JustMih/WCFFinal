import React, { useRef, useEffect } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineController,
} from "chart.js";

// Register necessary components, including the LineController
ChartJS.register(
  Title,
  Tooltip,
  Legend,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineController
);

const CallChart = () => {
  const chartRef = useRef(null); // Ref to hold the chart instance

  const data = {
    labels: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11"], // Hours of the day
    datasets: [
      {
        label: "Total Calls",
        data: [0, 1, 0, 0, 1, 2, 1, 0, 1, 0, 0, 1],
        borderColor: "rgba(144, 238, 144, 1)",
        backgroundColor: "rgba(144, 238, 144, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Answered Calls",
        data: [0, 1, 0, 0, 1, 2, 1, 0, 1, 0, 0, 1],
        borderColor: "rgba(0, 255, 0, 1)",
        backgroundColor: "rgba(0, 255, 0, 0.2)",
        fill: true,
        tension: 0.4,
      },
      {
        label: "Dropped Calls",
        data: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
        borderColor: "rgba(169, 169, 169, 1)",
        backgroundColor: "rgba(169, 169, 169, 0.2)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      title: {
        display: true,
        text: "Calls Throughout the Day",
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Number of Calls",
        },
      },
      x: {
        title: {
          display: true,
          text: "Hour of the Day",
        },
      },
    },
  };

  useEffect(() => {
    // Create the chart instance
    const chartInstance = new ChartJS(chartRef.current, {
      type: "line",
      data: data,
      options: options,
    });

    // Cleanup the chart instance on component unmount
    return () => {
      chartInstance.destroy();
    };
  }, [data, options]); // Recreate chart when data or options change

  return (
    <div className="call-chart-container">
      <canvas ref={chartRef} />
    </div>
  );
};

export default CallChart;
