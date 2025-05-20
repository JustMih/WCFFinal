import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import './CDRReports.css'; // <-- Custom CSS file
import htmlDocx from 'html-docx-js/dist/html-docx';

const CDRReports = () => {
  const [cdrReports, setCDRReports] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axios.get('http://localhost:5070/api/reports/cdr-reports')
      .then(response => setCDRReports(response.data))
      .catch(error => console.error(error));
  }, []);

  const filteredReports = cdrReports.filter(cdr =>
    cdr.clid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cdr.dst?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReports = filteredReports.slice(startIndex, startIndex + itemsPerPage);

  const handleExportExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredReports);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CDR Reports');
    XLSX.writeFile(workbook, 'cdr_reports.xlsx');
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text('CDR Reports', 14, 10);
    doc.autoTable({
      head: [[
        'ID', 'Caller ID', 'Source', 'Destination', 'Duration', 'BillSec', 'Disposition', 'Recording', 'Start Time'
      ]],
      body: filteredReports.map(r => [
        r.id, r.clid, r.src, r.dst, r.duration, r.billsec,
        r.disposition, r.recordingfile, new Date(r.cdrstarttime).toLocaleString()
      ]),
    });
    doc.save('cdr_reports.pdf');
  };

  const handleExportWord = () => {
    const table = document.getElementById('cdr-table-container');
    const html = `<html><body>${table.innerHTML}</body></html>`;
    const converted = htmlDocx.asBlob(html);
    saveAs(converted, 'cdr_reports.docx');
  };

  return (
    <div className="cdr-container">
      <h2 className="cdr-title">CDR Reports</h2>

      <div className="cdr-controls">
        <input
          type="text"
          placeholder="Search Caller ID or Destination"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="ivr-search"
        />

        <div className="cdr-buttons">
          <button onClick={handleExportExcel} className="btn btn-excel">Export Excel</button>
          <button onClick={handleExportPDF} className="btn btn-pdf">Export PDF</button>
          <button onClick={handleExportWord} className="btn btn-word">Export Word</button>
        </div>
      </div>

      <div id="cdr-table-container" className="cdr-table-wrapper">
        <table className="cdr-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Caller ID</th>
              <th>Source</th>
              <th>Destination</th>
              <th>Duration</th>
              <th>BillSec</th>
              <th>Disposition</th>
              <th>Recording</th>
              <th>Start Time</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReports.length ? (
              paginatedReports.map(cdr => (
                <tr key={cdr.id}>
                  <td>{cdr.id}</td>
                  <td>{cdr.clid}</td>
                  <td>{cdr.src}</td>
                  <td>{cdr.dst}</td>
                  <td>{cdr.duration}</td>
                  <td>{cdr.billsec}</td>
                  <td>{cdr.disposition}</td>
                  <td>{cdr.recordingfile}</td>
                  <td>{new Date(cdr.cdrstarttime).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-results">No results found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="cdr-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1}>
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default CDRReports;
