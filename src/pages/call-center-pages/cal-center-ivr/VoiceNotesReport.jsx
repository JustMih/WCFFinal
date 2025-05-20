import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import htmlDocx from 'html-docx-js/dist/html-docx';
import './VoiceNotesReport.css';
const baseURL = 'http://localhost:5070'; // backend URL

const VoiceNotesReport = () => {
  const [voiceNotes, setVoiceNotes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axios.get('http://localhost:5070/api/reports/voice-notes')
      .then(response => setVoiceNotes(response.data))
      .catch(error => console.error(error));
  }, []);

  const filtered = voiceNotes.filter(n =>
    n.clid?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.recording_path?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filtered);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Voice Notes');
    XLSX.writeFile(wb, 'voice_notes.xlsx');
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('Voice Notes Report', 14, 10);
    doc.autoTable({
      head: [['ID', 'Recording Path', 'Caller ID', 'Created At']],
      body: filtered.map(n => [
        n.id, n.recording_path, n.clid, new Date(n.created_at).toLocaleString()
      ]),
    });
    doc.save('voice_notes.pdf');
  };

  const exportWord = () => {
    const table = document.getElementById('voice-table');
    const html = `<html><body>${table.outerHTML}</body></html>`;
    const blob = htmlDocx.asBlob(html);
    saveAs(blob, 'voice_notes.docx');
  };

  return (
    <div className="voice-container">
      <h2 className="voice-title">Voice Notes Report</h2>
      <div className="voice-controls">
        <input
          type="text"
          placeholder="Search Caller ID or Path"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="voice-search"
        />
        <div className="voice-buttons">
          <button onClick={exportExcel} className="btn btn-excel">Export Excel</button>
          <button onClick={exportPDF} className="btn btn-pdf">Export PDF</button>
          <button onClick={exportWord} className="btn btn-word">Export Word</button>
        </div>
      </div>

      <div className="voice-table-wrapper" id="voice-table">
        <table className="voice-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Recording Path</th>
              <th>Caller ID</th>
              <th>Created At</th>
            </tr>
          </thead>
          <tbody>
  {paginated.length > 0 ? paginated.map(note => (
    <tr key={note.id}>
      <td>{note.id}</td>
      <td>
        <a href={note.recording_path} target="_blank" rel="noopener noreferrer">
          {note.recording_path}
        </a>
      </td>
      <td>{note.clid}</td>
      <td>{new Date(note.created_at).toLocaleString()}</td>
    </tr>
  )) : (
    <tr><td colSpan="4" className="no-results">No results found.</td></tr>
  )}
</tbody>

        </table>
      </div>

      <div className="voice-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default VoiceNotesReport;
