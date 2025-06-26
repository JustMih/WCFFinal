
// export default DTMFStats;
 import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { baseURL } from "../../../config";

const digitLabels = {
  '3': 'Registration Info',
  '4': 'Confirmation Info',
  '5': 'Claims Info',
  '6': 'Compulsion Details',
  '7': 'Accident Details',
  '8': 'Office in Dodoma',
  '9': 'Agent / Support Queue',
  '10': 'Record Voice Note',
  '11': 'Voice Note Saved',
};

const DTMFStats = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    axios.get(`${baseURL}/dtmf-stats`)
      .then(res => {
        setLogs(res.data);
      })
      .catch(err => console.error(err));
  }, []);

  const countMap = {};
  logs.forEach(log => {
    const digit = log.digit_pressed;
    if (digitLabels[digit]) {
      countMap[digit] = (countMap[digit] || 0) + 1;
    }
  });

  const digits = Object.keys(countMap).sort();

  const barColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
  ];

  const data = {
    labels: digits.map(d => digitLabels[d] || `Key ${d}`),
    datasets: [{
      label: '# of Users',
      data: digits.map(d => countMap[d]),
      backgroundColor: digits.map((_, i) => barColors[i % barColors.length]),
      borderColor: '#ffffff',
      borderWidth: 1
    }]
  };

  const options = {
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: {
        label: ctx => `${ctx.dataset.label}: ${ctx.formattedValue}`
      }}
    },
    scales: {
      x: {
        ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 }
      }
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: 'auto' }}>
      <h3 style={{ textAlign: 'center' }}>IVR DTMF Usage Report</h3>
      <div style={{ height: '300px', width: '100%', marginBottom: '2rem' }}>
        <Bar data={data} options={options} />
      </div>

      <h4>DTMF Usage Table</h4>
      <table border="1" cellPadding="8" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
        <thead>
          <tr>
            <th>Digit</th>
            <th>DTMF Action</th>
            <th>Caller ID</th>
            <th>Language</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.filter(item => digitLabels[item.digit_pressed]).map((item, index) => (
            <tr key={index}>
              <td>{item.digit_pressed}</td>
              <td>{digitLabels[item.digit_pressed]}</td>
              <td>{item.caller_id}</td>
              <td>{item.language}</td>
              <td>{item.timestamp ? new Date(item.timestamp.replace(' ', 'T')).toLocaleString() : 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DTMFStats;
