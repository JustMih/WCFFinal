// export default DTMFStats;
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { baseURL } from "../../../config";
import ReactApexChart from 'react-apexcharts';
import DataTable from 'react-data-table-component';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
  const digitNames = digits.map(d => digitLabels[d] || `Key ${d}`);
  const digitCounts = digits.map(d => countMap[d]);

  const barColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
  ];

  // Apex Radial Chart config
  const radialOptions = {
    chart: { type: 'radialBar', height: 350 },
    plotOptions: {
      radialBar: {
        dataLabels: {
          name: { fontSize: '16px' },
          value: { fontSize: '14px' },
          total: {
            show: true,
            label: 'Total',
            formatter: () => digitCounts.reduce((a, b) => a + b, 0)
          }
        }
      }
    },
    labels: digitNames,
    colors: digits.map((_, i) => barColors[i % barColors.length]),
    legend: { show: true, position: 'bottom' }
  };

  // Apex Bar Chart config
  const apexBarOptions = {
    chart: { type: 'bar', height: 350 },
    plotOptions: {
      bar: {
        horizontal: true,
        borderRadius: 4,
        dataLabels: { position: 'top' },
        distributed: true,
        barHeight: '15%'
      }
    },
    dataLabels: {
      enabled: true,
      formatter: val => val,
      offsetX: 0,
      style: { fontSize: '12px', colors: ['#333'] }
    },
    xaxis: {
      categories: digitNames,
      title: { text: '# of Users' }
    },
    yaxis: {
      labels: { show: false }
    },
    colors: digits.map((_, i) => barColors[i % barColors.length]),
    legend: { show: false },
    tooltip: { enabled: true },
    grid: { show: false }
  };

  // DataTable columns
  const columns = [
    { name: 'Digit', selector: row => row.digit_pressed, sortable: true, width: '80px' },
    { name: 'DTMF Action', selector: row => digitLabels[row.digit_pressed], sortable: true, wrap: true },
    { name: 'Caller ID', selector: row => row.caller_id, sortable: true },
    { name: 'Language', selector: row => row.language, sortable: true },
    { name: 'Timestamp', selector: row => row.timestamp ? new Date(row.timestamp.replace(' ', 'T')).toLocaleString() : 'N/A', sortable: true },
  ];

  // Filter logs for only those with valid digit labels
  const filteredLogs = logs.filter(item => digitLabels[item.digit_pressed]);

  // CSV headers
  const csvHeaders = [
    { label: 'Digit', key: 'digit_pressed' },
    { label: 'DTMF Action', key: 'dtmf_action' },
    { label: 'Caller ID', key: 'caller_id' },
    { label: 'Language', key: 'language' },
    { label: 'Timestamp', key: 'timestamp' },
  ];
  // Prepare CSV data
  const csvData = filteredLogs.map(item => ({
    digit_pressed: item.digit_pressed,
    dtmf_action: digitLabels[item.digit_pressed],
    caller_id: item.caller_id,
    language: item.language,
    timestamp: item.timestamp ? new Date(item.timestamp.replace(' ', 'T')).toLocaleString() : 'N/A',
  }));

  // Excel export handler
  const handleExcelExport = () => {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DTMF Usage');
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'dtmf_usage.xlsx');
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: 'auto' }}>
      <h3 style={{ textAlign: 'center' }}>IVR DTMF Usage Report</h3>
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: 320, maxWidth: 400, background: '#fafbfc', borderRadius: 8, padding: 16 }}>
          <h4 style={{ textAlign: 'center' }}>Radial Chart</h4>
          {digitCounts.length > 0 ? (
            <ReactApexChart options={radialOptions} series={digitCounts} type="radialBar" height={320} />
          ) : (
            <div style={{ textAlign: 'center', color: '#888', padding: '2rem 0' }}>No data for radial chart.</div>
          )}
        </div>
        <div style={{ flex: 2, minWidth: 400, background: '#fafbfc', borderRadius: 8, padding: 16 }}>
          <h4 style={{ textAlign: 'center' }}>Bar Chart</h4>
          <ReactApexChart options={apexBarOptions} series={[{ data: digitCounts }]} type="bar" height={320} />
        </div>
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1rem'
      }}>
        <h4 style={{ margin: 0 }}>DTMF Usage Table</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <CSVLink
            data={csvData}
            headers={csvHeaders}
            filename="dtmf_usage.csv"
            style={{
              background: 'linear-gradient(90deg, #36d1c4 0%, #5b86e5 100%)',
              color: '#fff',
              padding: '8px 16px',
              borderRadius: '5px',
              textDecoration: 'none',
              fontWeight: 'bold',
              boxShadow: '0 2px 6px rgba(54,209,196,0.2)'
            }}
          >
            Export CSV
          </CSVLink>
          <button
            onClick={handleExcelExport}
            style={{
              background: 'linear-gradient(90deg, #ff512f 0%, #dd2476 100%)',
              color: '#fff',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(221,36,118,0.2)'
            }}
          >
            Export Excel
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        data={filteredLogs}
        pagination
        highlightOnHover
        dense
        striped
        responsive
        defaultSortFieldId={5}
      />
    </div>
  );
};

export default DTMFStats;
