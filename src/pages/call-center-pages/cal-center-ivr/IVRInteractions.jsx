 import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import htmlDocx from 'html-docx-js/dist/html-docx';
import './IVRInteractions.css';
import { baseURL } from '../../../config';

const IVRInteractions = () => {
  const [ivrInteractions, setIVRInteractions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  /* 🔍 NEW FILTER STATES */
  const [dtmfFilter, setDtmfFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [voiceFilter, setVoiceFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const itemsPerPage = 10;

  useEffect(() => {
    axios
      .get(`${baseURL}/reports/ivr-interactions`)
      .then(res => setIVRInteractions(res.data))
      .catch(err => console.error(err));
  }, []);

  /* 🔍 FILTER LOGIC (ADDITIVE ONLY) */
  const filtered = useMemo(() => {
    return ivrInteractions.filter(i => {
      const createdAt = new Date(i.createdAt);

      const matchSearch =
        searchTerm === '' ||
        i.dtmf_digit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.parameter?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDTMF = dtmfFilter ? i.dtmf_digit === dtmfFilter : true;

      const matchAction = actionFilter
        ? i.action?.name === actionFilter
        : true;

      const matchVoice = voiceFilter
        ? i.voice?.file_name === voiceFilter
        : true;

      const matchFromDate = fromDate
        ? createdAt >= new Date(fromDate)
        : true;

      const matchToDate = toDate
        ? createdAt <= new Date(toDate + 'T23:59:59')
        : true;

      return (
        matchSearch &&
        matchDTMF &&
        matchAction &&
        matchVoice &&
        matchFromDate &&
        matchToDate
      );
    });
  }, [
    ivrInteractions,
    searchTerm,
    dtmfFilter,
    actionFilter,
    voiceFilter,
    fromDate,
    toDate,
  ]);

  /* PAGINATION */
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  /* 📄 EXPORTS (UNCHANGED) */
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'IVR Interactions');
    XLSX.writeFile(wb, 'ivr_interactions.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('IVR Interactions Report', 14, 10);
    doc.autoTable({
      head: [['ID', 'DTMF', 'Action Name', 'Parameter', 'IVR Voice', 'Created At']],
      body: filtered.map(i => [
        i.id,
        i.dtmf_digit,
        i.action?.name || 'N/A',
        i.parameter,
        i.voice?.file_name || 'N/A',
        new Date(i.createdAt).toLocaleString(),
      ]),
    });
    doc.save('ivr_interactions.pdf');
  };

  const exportWord = () => {
    const table = document.getElementById('ivr-table');
    const html = `<html><body>${table.outerHTML}</body></html>`;
    const blob = htmlDocx.asBlob(html);
    saveAs(blob, 'ivr_interactions.docx');
  };

  /* 🔽 UNIQUE VALUES FOR SELECTS */
  const uniqueDTMF = [...new Set(ivrInteractions.map(i => i.dtmf_digit).filter(Boolean))];
  const uniqueActions = [...new Set(ivrInteractions.map(i => i.action?.name).filter(Boolean))];
  const uniqueVoices = [...new Set(ivrInteractions.map(i => i.voice?.file_name).filter(Boolean))];

  return (
    <div className="ivr-container">
      <h2 className="ivr-title">IVR Interactions</h2>

      {/* 🔍 FILTER CONTROLS */}
      <div className="ivr-controls">
        <input
          type="text"
          placeholder="Search DTMF or Parameter"
          value={searchTerm}
          onChange={e => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="ivr-search"
        />

        <select value={dtmfFilter} onChange={e => { setDtmfFilter(e.target.value); setCurrentPage(1); }}>
          <option value="">All DTMF</option>
          {uniqueDTMF.map(d => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setCurrentPage(1); }}>
          <option value="">All Actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>

        <select value={voiceFilter} onChange={e => { setVoiceFilter(e.target.value); setCurrentPage(1); }}>
          <option value="">All Voices</option>
          {uniqueVoices.map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setCurrentPage(1); }} />
        <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setCurrentPage(1); }} />

        <div className="ivr-buttons">
          <button className="btn btn-excel" onClick={exportExcel}>Excel</button>
          <button className="btn btn-pdf" onClick={exportPDF}>PDF</button>
          <button className="btn btn-word" onClick={exportWord}>Word</button>
        </div>
      </div>

      {/* TABLE */}
      <div className="ivr-table-wrapper" id="ivr-table">
        <table className="ivr-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>DTMF Digit</th>
              <th>Action Name</th>
              <th>Parameter</th>
              <th>IVR Voice Name</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? paginated.map((i, idx) => (
              <tr key={i.id}>
                <td>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                <td>{i.dtmf_digit}</td>
                <td>{i.action?.name || 'N/A'}</td>
                <td>{i.parameter}</td>
                <td>{i.voice?.file_name || 'N/A'}</td>
                <td>{new Date(i.createdAt).toLocaleString()}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="6" className="no-results">No results found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="ivr-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default IVRInteractions;
