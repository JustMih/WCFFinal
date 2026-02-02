import React, { useEffect, useState } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import htmlDocx from 'html-docx-js/dist/html-docx';
import './IVRInteractions.css';
import { baseURL } from '../../../config';  // ✅ Use your configured base URL

const IVRInteractions = () => {
  const [ivrInteractions, setIVRInteractions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    axios.get(`${baseURL}/reports/ivr-interactions`)  // ✅ Replace with baseURL
      .then(response => setIVRInteractions(response.data))
      .catch(error => console.error(error));
  }, []);

  const filtered = ivrInteractions.filter(i =>
    i.dtmf_digit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    i.parameter?.toLowerCase().includes(searchTerm.toLowerCase())
  );
 

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
      head: [['ID', 'DTMF', 'Action ID', 'Parameter', 'IVR Voice ID', 'Created At', 'Updated At']],
      body: filtered.map(i => [
        i.id, i.dtmf_digit, i.action_id, i.parameter, i.ivr_voice_id,
        new Date(i.createdAt).toLocaleString(), new Date(i.updatedAt).toLocaleString()
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

  return (
    <div className="ivr-container">
      <h2 className="ivr-title">IVR Interactions</h2>
      <div className="ivr-controls">
        <input
          type="text"
          placeholder="Search DTMF or Parameter"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="ivr-search"
        />
        <div className="ivr-buttons">
          <button className="btn btn-excel" onClick={exportExcel}>Export Excel</button>
          <button className="btn btn-pdf" onClick={exportPDF}>Export PDF</button>
          <button className="btn btn-word" onClick={exportWord}>Export Word</button>
        </div>
      </div>
      <div className="ivr-table-wrapper" id="ivr-table">
        <table className="ivr-table">
          <thead>
            <tr>
              <th>ID</th><th>DTMF Digit</th><th>Action Name</th><th>Parameter</th>
              <th>IVR Voice Name</th><th>Created At</th><th>Updated At</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? paginated.map((i, index) => (
              <tr key={i.id}>
                <td>{index + 1}</td>
                <td>{i.dtmf_digit}</td>
                <td>{i.action?.name || 'N/A'}</td>  
                <td>{i.parameter}</td>
                <td>{i.voice?.file_name || 'N/A'}</td>  
                <td>{new Date(i.createdAt).toLocaleString()}</td>
                <td>{new Date(i.updatedAt).toLocaleString()}</td>
              </tr>
            )) : (
              <tr><td colSpan="7" className="no-results">No results found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="ivr-pagination">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>Prev</button>
        <span>Page {currentPage} of {totalPages}</span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>Next</button>
      </div>
    </div>
  );
};

export default IVRInteractions;
