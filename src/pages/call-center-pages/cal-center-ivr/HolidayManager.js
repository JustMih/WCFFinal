import React, { useEffect, useState } from 'react';
import axios from 'axios';
import "./HolidayManager.css";

const API_BASE = 'http://localhost:5070/api/holidays';

function HolidayManager() {
  const [holidays, setHolidays] = useState([]);
  const [form, setForm] = useState({ holiday_date: '', name: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchHolidays = async () => {
    const res = await axios.get(API_BASE);
    setHolidays(res.data);
  };

  const addHoliday = async () => {
    if (!form.holiday_date || !form.name) return;
    await axios.post(API_BASE, form);
    setForm({ holiday_date: '', name: '' });
    setSuccessMessage("✅ Successfully created");
    fetchHolidays();
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const deleteHoliday = async (id) => {
    await axios.delete(`${API_BASE}/${id}`);
    fetchHolidays();
  };

  const filteredHolidays = holidays.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredHolidays.length / itemsPerPage);
  const paginatedHolidays = filteredHolidays.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => { fetchHolidays(); }, []);

  return (
    <div className="holiday-container">
      <h2 className="holiday-title">📅 Holiday Manager</h2>

      <div className="holiday-form">
        <input
          type="date"
          value={form.holiday_date}
          onChange={(e) => setForm({ ...form, holiday_date: e.target.value })}
          className="holiday-input"
        />
        <input
          type="text"
          placeholder="Holiday Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="holiday-input"
        />
        <button onClick={addHoliday} className="holiday-add-btn">Add Holiday</button>
      </div>

      {successMessage && <div className="holiday-feedback">{successMessage}</div>}

      <div className="holiday-search-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <table className="holiday-table">
        <thead>
          <tr>
            <th className="holiday-th">📆 Date</th>
            <th className="holiday-th">🎉 Name</th>
            <th className="holiday-th">🛠️ Action</th>
          </tr>
        </thead>
        <tbody>
          {paginatedHolidays.map((h) => (
            <tr key={h.id}>
              <td className="holiday-td">{h.holiday_date}</td>
              <td className="holiday-td">{h.name}</td>
              <td className="holiday-td">
                <button onClick={() => deleteHoliday(h.id)} className="holiday-delete-btn">
                  Delete ❌
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="holiday-search-bar" style={{ marginTop: '20px' }}>
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            style={{
              margin: '0 5px',
              padding: '5px 10px',
              backgroundColor: currentPage === i + 1 ? '#007bff' : '#ccc',
              color: currentPage === i + 1 ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
            onClick={() => setCurrentPage(i + 1)}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default HolidayManager;
