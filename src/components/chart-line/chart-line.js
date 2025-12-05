import React from "react";
import { Line } from "react-chartjs-2";
import "./chart-line.css";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const ChartComponent = () => {
  // Sample data for the chart (replace with your dynamic data)
  const data = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
    ],
    datasets: [
      {
        label: "Total Calls",
        data: [198, 220, 245, 210, 250, 230, 240, 215, 235, 225, 230],
        borderColor: "blue",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        fill: true,
      },
      {
        label: "Total Inbound Calls",
        data: [156, 160, 175, 180, 170, 165, 160, 155, 150, 160, 165],
        borderColor: "green",
        backgroundColor: "rgba(40, 167, 69, 0.2)",
        fill: true,
      },
      {
        label: "Total Outbound Calls",
        data: [5, 7, 4, 6, 8, 5, 6, 7, 4, 6, 5],
        borderColor: "gray",
        backgroundColor: "rgba(108, 117, 125, 0.2)",
        fill: true,
      },
      {
        label: "Total Internal Calls",
        data: [37, 40, 43, 42, 39, 41, 38, 36, 40, 42, 43],
        borderColor: "black",
        backgroundColor: "rgba(0, 0, 0, 0.2)",
        fill: true,
      },
      {
        label: "Total Answered Calls",
        data: [177, 180, 190, 185, 200, 195, 190, 185, 175, 180, 185],
        borderColor: "orange",
        backgroundColor: "rgba(255, 165, 0, 0.2)",
        fill: true,
      },
      {
        label: "Total Missed Calls",
        data: [21, 25, 15, 20, 18, 25, 30, 28, 22, 21, 18],
        borderColor: "red",
        backgroundColor: "rgba(255, 0, 0, 0.2)",
        fill: true,
      },
      {
        label: "Avg Inbound Call Time",
        data: [
          "00:03:38",
          "00:04:20",
          "00:03:50",
          "00:03:15",
          "00:03:10",
          "00:03:25",
          "00:03:30",
          "00:03:15",
          "00:03:40",
          "00:03:50",
          "00:03:45",
        ],
        borderColor: "blue",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        fill: true,
      },
      {
        label: "Avg Outbound Call Time",
        data: [
          "00:00:18",
          "00:00:20",
          "00:00:15",
          "00:00:19",
          "00:00:17",
          "00:00:18",
          "00:00:16",
          "00:00:20",
          "00:00:19",
          "00:00:18",
          "00:00:17",
        ],
        borderColor: "purple",
        backgroundColor: "rgba(128, 0, 128, 0.2)",
        fill: true,
      },
      {
        label: "Avg Internal Call Time",
        data: [
          "00:00:17",
          "00:00:18",
          "00:00:15",
          "00:00:16",
          "00:00:14",
          "00:00:15",
          "00:00:17",
          "00:00:16",
          "00:00:18",
          "00:00:17",
          "00:00:15",
        ],
        borderColor: "brown",
        backgroundColor: "rgba(165, 42, 42, 0.2)",
        fill: true,
      },
      {
        label: "Avg Calls Per Minute",
        data: [4, 5, 4, 4, 4, 5, 5, 5, 4, 5, 4],
        borderColor: "pink",
        backgroundColor: "rgba(255, 105, 180, 0.2)",
        fill: true,
      },
      {
        label: "Avg Call Time",
        data: [
          "00:02:48",
          "00:03:10",
          "00:02:55",
          "00:02:40",
          "00:02:50",
          "00:02:45",
          "00:02:58",
          "00:03:00",
          "00:02:45",
          "00:02:55",
          "00:02:50",
        ],
        borderColor: "yellow",
        backgroundColor: "rgba(255, 255, 0, 0.2)",
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: "Call Overview",
      },
      legend: {
        position: "bottom",
        labels: {
          usePointStyle: true, // This changes the legend items to circles
          boxWidth: 10, // Controls the size of the circle
          padding: 15, // Adjusts spacing between items
          color: "grey", // Customizes the color of the labels
        },
      },
      tooltip: {
        enabled: true, // Enable tooltips to show on hover
        mode: "index",
        intersect: false,
      },
    },
  };

  return (
    <div className="p-6">
      <div className="chart-container">
        <Line data={data} options={options} height={350} />
      </div>
    </div>
  );
};

export default ChartComponent;
