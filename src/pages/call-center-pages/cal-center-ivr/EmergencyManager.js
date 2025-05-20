import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './EmergencyManager.css';

const API = 'http://localhost:5070/api/emergency';

function EmergencyManager() {
  const [numbers, setNumbers] = useState([]);
  const [form, setForm] = useState({ phone_number: '', priority: '' });
  const [editId, setEditId] = useState(null);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const numbersPerPage = 5;

  const fetchNumbers = async () => {
    try {
      const res = await axios.get(API);
      setNumbers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async () => {
    if (!form.phone_number || !form.priority) return;
    try {
      if (editId) {
        await axios.put(`${API}/${editId}`, form);
        setMessage('✅ Updated successfully.');
      } else {
        await axios.post(API, form);
        setMessage('✅ Added successfully.');
      }
      setForm({ phone_number: '', priority: '' });
      setEditId(null);
      fetchNumbers();
    } catch (err) {
      setMessage('❌ Error occurred while submitting.');
    }
  };

  const handleEdit = (num) => {
    setForm({ phone_number: num.phone_number, priority: num.priority });
    setEditId(num.id);
    setMessage('');
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API}/${id}`);
      setMessage('🗑️ Deleted successfully.');
      fetchNumbers();
    } catch (err) {
      setMessage('❌ Error occurred while deleting.');
    }
  };

  useEffect(() => {
    fetchNumbers();
  }, []);

  // Pagination logic
  const indexOfLast = currentPage * numbersPerPage;
  const indexOfFirst = indexOfLast - numbersPerPage;
  const currentNumbers = numbers.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(numbers.length / numbersPerPage);

  return (
    <div className="emergency-container">
      <h2>📞 Emergency Number Manager</h2>
      {message && <div className="message">{message}</div>}

      <div className="form-section">
        <input
          type="text"
          placeholder="Phone Number"
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
        />
        <input
          type="number"
          placeholder="Priority"
          value={form.priority}
          onChange={(e) => setForm({ ...form, priority: e.target.value })}
        />
        <button onClick={handleSubmit}>
          {editId ? 'Update' : 'Add'}
        </button>
      </div>

      <table className="emergency-table">
        <thead>
          <tr>
            <th>📱 Phone Number</th>
            <th>🔢 Priority</th>
            <th>⚙️ Actions</th>
          </tr>
        </thead>
        <tbody>
          {currentNumbers.map(num => (
            <tr key={num.id}>
              <td>{num.phone_number}</td>
              <td>{num.priority}</td>
              <td>
                <button onClick={() => handleEdit(num)}>✏️</button>
                <button onClick={() => handleDelete(num.id)}>🗑️</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="pagination">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i + 1}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? 'active' : ''}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default EmergencyManager;
