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
  const [stats, setStats] = useState([]);

  useEffect(() => {
    axios.get(`${baseURL}/dtmf-stats`)
      .then(res => setStats(res.data))
      .catch(err => console.error(err));
  }, []);

  const data = {
    labels: stats.map(item => digitLabels[item.digit_pressed] || `Key ${item.digit_pressed}`),
    datasets: [{
      label: '# of Presses',
      data: stats.map(item => Number(item.count)), // ✅ Ensure number type
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
    }]
  };
  

  return (
    <div style={{ padding: '2rem' }}>
      <h2>IVR DTMF Usage Report</h2>
      <Bar data={data} />
      <pre style={{ marginTop: '1rem', background: '#eee', padding: '1rem' }}>
  {JSON.stringify(stats, null, 2)}
</pre>

      <h3 style={{ marginTop: '2rem' }}>DTMF Usage Table</h3>
      <table border="1" cellPadding="8" style={{ marginTop: '1rem', width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th>Digit</th>
            <th>Label</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((item, index) => (
            <tr key={index}>
              <td>{item.digit_pressed}</td>
              <td>{digitLabels[item.digit_pressed] || 'Unknown'}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DTMFStats;
