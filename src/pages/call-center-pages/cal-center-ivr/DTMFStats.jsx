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

  /* FILTER STATES */
  const [digitFilter, setDigitFilter] = useState('');
  const [callerFilter, setCallerFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  /* FETCH DATA */
  useEffect(() => {
    axios.get(`${baseURL}/dtmf-stats`)
      .then(res => setLogs(res.data || []))
      .catch(console.error);
  }, []);

  /* FILTER */
  const filteredLogs = useMemo(() => {
    const search = searchText.toLowerCase();

    return logs.filter(item => {
      if (!digitLabels[item.digit_pressed]) return false;

      const createdAt = item.timestamp
        ? new Date(item.timestamp.replace(' ', 'T'))
        : null;

      const matchSearch =
        String(item.digit_pressed).includes(search) ||
        digitLabels[item.digit_pressed].toLowerCase().includes(search) ||
        item.caller_id?.toLowerCase().includes(search) ||
        item.language?.toLowerCase().includes(search);

      const matchDigit = digitFilter ? item.digit_pressed === digitFilter : true;
      const matchCaller = callerFilter ? item.caller_id === callerFilter : true;
      const matchLang = languageFilter ? item.language === languageFilter : true;
      const matchFrom = fromDate ? createdAt >= new Date(fromDate) : true;
      const matchTo = toDate ? createdAt <= new Date(toDate + 'T23:59:59') : true;

      return (
        matchSearch &&
        matchDigit &&
        matchCaller &&
        matchLang &&
        matchFrom &&
        matchTo
      );
    });
  }, [logs, searchText, digitFilter, callerFilter, languageFilter, fromDate, toDate]);

  /* CHART DATA */
  const countMap = {};
  filteredLogs.forEach(l => {
    countMap[l.digit_pressed] = (countMap[l.digit_pressed] || 0) + 1;
  });

  const digits = Object.keys(countMap).sort();
  const digitNames = digits.map(d => digitLabels[d]);
  const digitCounts = digits.map(d => countMap[d]);
  const maxValue = Math.max(...digitCounts, 1);

  const barColors = [
    '#3366CC', '#DC3912', '#FF9900', '#109618',
    '#990099', '#3B3EAC', '#0099C6', '#DD4477'
  ];

  /* RADIAL CHART */
  const radialOptions = {
    chart: { type: 'radialBar', height: 420 },
    plotOptions: {
      radialBar: {
        hollow: { size: '55%' },
        dataLabels: {
          total: {
            show: true,
            label: 'Total',
            formatter: () => digitCounts.reduce((a, b) => a + b, 0)
          }
        }
      }
    },
    labels: digitNames,
    colors: digits.map((_, i) => barColors[i % barColors.length])
  };

  /* BAR CHART */
  const apexBarOptions = {
    chart: { type: 'bar', height: 420 },
    plotOptions: {
      bar: { horizontal: true, distributed: true, borderRadius: 6 }
    },
    xaxis: { categories: digitNames, max: maxValue + 2 },
    colors: digits.map((_, i) => barColors[i % barColors.length])
  };

  /* TABLE */
  const columns = [
    { name: 'Digit', selector: r => r.digit_pressed, sortable: true, width: '80px' },
    { name: 'DTMF Action', selector: r => digitLabels[r.digit_pressed], wrap: true },
    { name: 'Caller ID', selector: r => r.caller_id },
    { name: 'Language', selector: r => r.language },
    {
      name: 'Timestamp',
      selector: r =>
        r.timestamp ? new Date(r.timestamp.replace(' ', 'T')).toLocaleString() : 'N/A'
    }
  ];

  /* EXPORT */
  const csvData = filteredLogs.map(i => ({
    digit_pressed: i.digit_pressed,
    dtmf_action: digitLabels[i.digit_pressed],
    caller_id: i.caller_id,
    language: i.language,
    timestamp: i.timestamp
      ? new Date(i.timestamp.replace(' ', 'T')).toLocaleString()
      : 'N/A'
  }));

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(csvData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DTMF Usage');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    saveAs(new Blob([buf]), 'dtmf_usage.xlsx');
  };

  return (
    <div style={{ padding: '1.5rem', maxWidth: 1250, margin: 'auto' }}>
      <h3 style={{ textAlign: 'center', marginBottom: 24 }}>
        IVR DTMF Usage Report
      </h3>

      {/* CHARTS */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '2rem',
        marginBottom: '2rem'
      }}>
        <div style={{ background: '#fafbfc', padding: 20, borderRadius: 12 }}>
          <h4 style={{ textAlign: 'center' }}>Radial Chart</h4>
          <ReactApexChart options={radialOptions} series={digitCounts} type="radialBar" height={420} />
        </div>

        <div style={{ background: '#fafbfc', padding: 20, borderRadius: 12 }}>
          <h4 style={{ textAlign: 'center' }}>Bar Chart</h4>
          <ReactApexChart options={apexBarOptions} series={[{ data: digitCounts }]} type="bar" height={420} />
        </div>
      </div>

      {/* FILTER + SEARCH + EXPORT (SINGLE ROW) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, auto) 1fr auto auto',
        gap: 10,
        alignItems: 'center',
        padding: 14,
        background: '#ffffff',
        borderRadius: 12,
        boxShadow: '0 8px 24px rgba(0,0,0,.06)',
        marginBottom: 16
      }}>
        <select onChange={e => setDigitFilter(e.target.value)}>
          <option value="">All Digits</option>
          {Object.keys(digitLabels).map(d =>
            <option key={d} value={d}>{d} - {digitLabels[d]}</option>
          )}
        </select>

        <select onChange={e => setCallerFilter(e.target.value)}>
          <option value="">All Callers</option>
          {[...new Set(logs.map(l => l.caller_id).filter(Boolean))].map(c =>
            <option key={c} value={c}>{c}</option>
          )}
        </select>

        <select onChange={e => setLanguageFilter(e.target.value)}>
          <option value="">All Languages</option>
          {[...new Set(logs.map(l => l.language).filter(Boolean))].map(l =>
            <option key={l} value={l}>{l}</option>
          )}
        </select>

        <input type="date" onChange={e => setFromDate(e.target.value)} />
        <input type="date" onChange={e => setToDate(e.target.value)} />

        <input
          type="text"
          placeholder="Search…"
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ padding: 8 }}
        />

        <CSVLink data={csvData} filename="dtmf_usage.csv">CSV</CSVLink>
        <button onClick={exportExcel}>Excel</button>
      </div>

      {/* TABLE */}
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
