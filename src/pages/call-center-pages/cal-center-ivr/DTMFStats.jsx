import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { baseURL } from "../../../config";
import ReactApexChart from 'react-apexcharts';
import DataTable from 'react-data-table-component';
import { CSVLink } from 'react-csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/* ===============================
   DTMF LABELS
=============================== */
const digitLabels = {
  '1': 'Registration Info',
  '2': 'Confirmation Info',
  '3': 'Claims Info',
  '4': 'Compulsion Details',
  '5': 'Accident Details',
  '6': 'Office in Dodoma',
  '7': 'Agent / Support Queue',
  '8': 'Record Voice Note',
  '9': 'Voice Note Saved',
};

const DTMFStats = () => {
  const [logs, setLogs] = useState([]);
  const [searchText, setSearchText] = useState('');

  /* ===============================
     FETCH DATA
  =============================== */
  useEffect(() => {
    axios
      .get(`${baseURL}/dtmf-stats`)
      .then(res => setLogs(res.data || []))
      .catch(err => console.error(err));
  }, []);

  /* ===============================
     FILTER
  =============================== */
  const filteredLogs = useMemo(() => {
    const search = searchText.toLowerCase();

    return logs.filter(item => {
      if (!digitLabels[item.digit_pressed]) return false;

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
     CHART DATA
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

  const maxValue = Math.max(...digitCounts, 1);

  const barColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618',
    '#990099', '#3B3EAC', '#0099C6', '#DD4477'
  ];

  /* ===============================
     RADIAL CHART (ENLARGED)
  =============================== */
  const radialOptions = {
    chart: {
      type: 'radialBar',
      height: 460
    },
    plotOptions: {
      radialBar: {
        startAngle: -90,
        endAngle: 270,
        hollow: {
          size: '55%' // 🔥 bigger center
        },
        track: {
          background: '#f0f0f0',
          strokeWidth: '100%'
        },
        dataLabels: {
          name: {
            fontSize: '16px',
            offsetY: -5
          },
          value: {
            fontSize: '22px',
            fontWeight: 600
          },
          total: {
            show: true,
            label: 'Total',
            fontSize: '16px',
            formatter: () =>
              digitCounts.reduce((a, b) => a + b, 0)
          }
        }
      }
    },
    stroke: {
      lineCap: 'round',
      width: 6 // 🔥 thicker arcs
    },
    yaxis: {
      max: maxValue
    },
    labels: digitNames,
    colors: digits.map((_, i) => barColors[i % barColors.length]),
    legend: {
      show: true,
      position: 'bottom',
      fontSize: '14px'
    }
  };

  /* ===============================
     BAR CHART (ENLARGED)
  =============================== */
 const apexBarOptions = {
  chart: {
    type: 'bar',
    height: 460,
    toolbar: { show: false }
  },

  plotOptions: {
    bar: {
      horizontal: true,
      borderRadius: 6,
      distributed: true,
      barHeight: '45%', // 🔥 thicker bars
      dataLabels: {
        position: 'right' // ✅ move numbers outside
      }
    }
  },

  dataLabels: {
    enabled: true,
    offsetX: 12, // ✅ space between bar & number
    style: {
      fontSize: '14px',
      fontWeight: 600,
      colors: ['#333'] // 🔥 readable on white
    }
  },

  xaxis: {
    categories: digitNames,
    min: 0,
    max: maxValue + 2, // 🔥 breathing room on the right
    title: {
      text: 'Number of Users',
      style: { fontSize: '14px', fontWeight: 600 }
    },
    labels: {
      style: { fontSize: '13px' }
    }
  },

  yaxis: {
    labels: {
      style: {
        fontSize: '13px',
        fontWeight: 500
      }
    }
  },

  grid: {
    borderColor: '#e5e7eb',
    strokeDashArray: 3,
    xaxis: { lines: { show: true } },
    yaxis: { lines: { show: false } }
  },

  tooltip: {
    enabled: true,
    y: {
      formatter: val => `${val} users`
    }
  },

  colors: digits.map((_, i) => barColors[i % barColors.length])
};

  /* ===============================
     TABLE COLUMNS
  =============================== */
  const columns = [
    { name: 'Digit', selector: row => row.digit_pressed, sortable: true, width: '80px' },
    {
      name: 'DTMF Action',
      selector: row => digitLabels[row.digit_pressed],
      sortable: true,
      wrap: true
    },
    { name: 'Caller ID', selector: row => row.caller_id, sortable: true },
    { name: 'Language', selector: row => row.language, sortable: true },
    {
      name: 'Timestamp',
      selector: row =>
        row.timestamp
          ? new Date(row.timestamp.replace(' ', 'T')).toLocaleString()
          : 'N/A',
      sortable: true
    }
  ];

  /* ===============================
     EXPORT
  =============================== */
  const csvData = filteredLogs.map(item => ({
    digit_pressed: item.digit_pressed,
    dtmf_action: digitLabels[item.digit_pressed],
    caller_id: item.caller_id,
    language: item.language,
    timestamp: item.timestamp
      ? new Date(item.timestamp.replace(' ', 'T')).toLocaleString()
      : 'N/A'
  }));

  const handleExcelExport = () => {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DTMF Usage');
    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buffer]), 'dtmf_usage.xlsx');
  };

  /* ===============================
     RENDER
  =============================== */
  return (
    <div style={{ padding: '1.5rem', maxWidth: '1200px', margin: 'auto' }}>
      <h3 style={{ textAlign: 'center' }}>IVR DTMF Usage Report</h3>

      {/* CHARTS */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2.5rem', marginBottom: '2.5rem' }}>
        <div style={{ flex: 1, minWidth: 420, background: '#fafbfc', padding: 20, borderRadius: 10 }}>
          <h4 style={{ textAlign: 'center' }}>Radial Chart</h4>
          <ReactApexChart
            options={radialOptions}
            series={digitCounts}
            type="radialBar"
            height={460}
          />
        </div>

        <div style={{ flex: 1.2, minWidth: 520, background: '#fafbfc', padding: 20, borderRadius: 10 }}>
          <h4 style={{ textAlign: 'center' }}>Bar Chart</h4>
          <ReactApexChart
            options={apexBarOptions}
            series={[{ data: digitCounts }]}
            type="bar"
            height={460}
          />
        </div>
      </div>

      {/* EXPORT + SEARCH */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h4>DTMF Usage Table</h4>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <CSVLink data={csvData} filename="dtmf_usage.csv">
            Export CSV
          </CSVLink>
          <button onClick={handleExcelExport}>Export Excel</button>
        </div>
      </div>

      <input
        type="text"
        placeholder="Search digit, action, caller, language, time..."
        value={searchText}
        onChange={e => setSearchText(e.target.value)}
        style={{
          width: '100%',
          padding: '10px',
          margin: '12px 0',
          borderRadius: 6,
          border: '1px solid #ccc'
        }}
      />

      <DataTable
        columns={columns}
        data={filteredLogs}
        pagination
        highlightOnHover
        striped
        responsive
      />
    </div>
  );
};

export default DTMFStats;
