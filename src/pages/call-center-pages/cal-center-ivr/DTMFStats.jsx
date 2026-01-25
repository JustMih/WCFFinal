 

import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
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
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    axios.get(`${baseURL}/dtmf-stats`)
      .then(res => setLogs(res.data))
      .catch(err => console.error(err));
  }, []);

  /* ===============================
     FILTER BY ALL COLUMNS
  =============================== */
  const filteredLogs = useMemo(() => {
    return logs.filter(item => {
      if (!digitLabels[item.digit_pressed]) return false;

      const search = searchText.toLowerCase();

      return (
        String(item.digit_pressed).includes(search) ||
        digitLabels[item.digit_pressed].toLowerCase().includes(search) ||
        item.caller_id?.toLowerCase().includes(search) ||
        item.language?.toLowerCase().includes(search) ||
        (item.timestamp &&
          new Date(item.timestamp.replace(' ', 'T'))
            .toLocaleString()
            .toLowerCase()
            .includes(search))
      );
    });
  }, [logs, searchText]);

  /* ===============================
     CHART DATA (UNCHANGED)
  =============================== */
  const countMap = {};
  filteredLogs.forEach(log => {
    const digit = log.digit_pressed;
    if (digitLabels[digit]) {
      countMap[digit] = (countMap[digit] || 0) + 1;
    }
  });

  const digits = Object.keys(countMap).sort();
  const digitNames = digits.map(d => digitLabels[d]);
  const digitCounts = digits.map(d => countMap[d]);

  const barColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618', '#990099',
    '#3B3EAC', '#0099C6', '#DD4477', '#66AA00', '#B82E2E'
  ];

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
      style: { fontSize: '12px', colors: ['#333'] }
    },
    xaxis: {
      categories: digitNames,
      title: { text: '# of Users' }
    },
    yaxis: { labels: { show: false } },
    colors: digits.map((_, i) => barColors[i % barColors.length]),
    legend: { show: false },
    grid: { show: false }
  };

  const columns = [
    { name: 'Digit', selector: row => row.digit_pressed, sortable: true, width: '80px' },
    { name: 'DTMF Action', selector: row => digitLabels[row.digit_pressed], sortable: true, wrap: true },
    { name: 'Caller ID', selector: row => row.caller_id, sortable: true },
    { name: 'Language', selector: row => row.language, sortable: true },
    {
      name: 'Timestamp',
      selector: row =>
        row.timestamp
          ? new Date(row.timestamp.replace(' ', 'T')).toLocaleString()
          : 'N/A',
      sortable: true,
    },
  ];

  const csvData = filteredLogs.map(item => ({
    digit_pressed: item.digit_pressed,
    dtmf_action: digitLabels[item.digit_pressed],
    caller_id: item.caller_id,
    language: item.language,
    timestamp: item.timestamp
      ? new Date(item.timestamp.replace(' ', 'T')).toLocaleString()
      : 'N/A',
  }));

  const handleExcelExport = () => {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DTMF Usage');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), 'dtmf_usage.xlsx');
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '900px', margin: 'auto' }}>
      <h3 style={{ textAlign: 'center' }}>IVR DTMF Usage Report</h3>

      {/* CHARTS (UNCHANGED) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', marginBottom: '2rem' }}>
        <div style={{ flex: 1, minWidth: 320, background: '#fafbfc', padding: 16, borderRadius: 8 }}>
          <h4 style={{ textAlign: 'center' }}>Radial Chart</h4>
          <ReactApexChart options={radialOptions} series={digitCounts} type="radialBar" height={320} />
        </div>

        <div style={{ flex: 2, minWidth: 400, background: '#fafbfc', padding: 16, borderRadius: 8 }}>
          <h4 style={{ textAlign: 'center' }}>Bar Chart</h4>
          <ReactApexChart options={apexBarOptions} series={[{ data: digitCounts }]} type="bar" height={320} />
        </div>
      </div>

      {/* TABLE HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>DTMF Usage Table</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <CSVLink data={csvData} filename="dtmf_usage.csv">Export CSV</CSVLink>
          <button onClick={handleExcelExport}>Export Excel</button>
        </div>
      </div>

      {/* 🔍 SEARCH BOX (TOP OF TABLE) */}
      <input
        type="text"
        placeholder="Search digit, action, caller, language, time..."
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{
          width: '100%',
          padding: '8px',
          margin: '10px 0',
          borderRadius: 6,
          border: '1px solid #ccc'
        }}
      />

      {/* TABLE */}
      <DataTable
        columns={columns}
        data={filteredLogs}
        pagination
        highlightOnHover
        dense
        striped
        responsive
      />
    </div>
  );
};

export default DTMFStats;
