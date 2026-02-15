import React, { useState, useEffect, useMemo } from "react";
import { baseURL } from "../../../config";
import { FaPlay, FaEdit, FaTrash, FaFileExcel } from "react-icons/fa";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "./callCenterIvr.css";

export default function CallCenterIvr() {
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ===============================
     FILTER & PAGINATION
  =============================== */
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  /* ===============================
     MODALS & FORM STATE
  =============================== */
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [voiceLanguage, setVoiceLanguage] = useState("english");
  const [editing, setEditing] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voiceToDelete, setVoiceToDelete] = useState(null);

  /* ===============================
     FETCH VOICES
  =============================== */
  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/ivr/voices`);
      const data = await res.json();
      setVoices(data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch IVR voices");
    }
    setLoading(false);
  };
const handleCreateVoice = async (e) => {
  e.preventDefault();

  if (!file || !fileName) {
    alert("Please provide file and file name");
    return;
  }

  const formData = new FormData();
  formData.append("voice_file", file);
  formData.append("file_name", fileName);
  formData.append("language", voiceLanguage);

  try {
    const res = await fetch(`${baseURL}/ivr/voices`, {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error("Failed to create voice");

    await fetchVoices();

    // reset
    setFileName("");
    setFile(null);
    setVoiceLanguage("english");
    setShowModal(false);
  } catch (err) {
    console.error(err);
    alert("Failed to create voice");
  }
};
const handleUpdateVoice = async (e) => {
  e.preventDefault();

  if (!fileName || !currentVoice) {
    alert("Missing data");
    return;
  }

  const payload = {
    file_name: fileName,
    file_path: currentVoice.file_path,
    language: voiceLanguage,
  };

  try {
    const res = await fetch(
      `${baseURL}/ivr/voices/${currentVoice.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) throw new Error("Failed to update voice");

    await fetchVoices();

    // reset
    setEditing(false);
    setCurrentVoice(null);
    setFileName("");
    setShowModal(false);
  } catch (err) {
    console.error(err);
    alert("Failed to update voice");
  }
};

  /* ===============================
     FILTERED DATA
  =============================== */
  const filteredVoices = useMemo(() => {
    const search = searchText.toLowerCase();
    return voices.filter(v =>
      v.file_name?.toLowerCase().includes(search) ||
      v.file_path?.toLowerCase().includes(search) ||
      v.language?.toLowerCase().includes(search)
    );
  }, [voices, searchText]);

  /* ===============================
     PAGINATION
  =============================== */
  const totalPages = Math.ceil(filteredVoices.length / pageSize);
  const paginatedVoices = filteredVoices.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  /* ===============================
     EXPORT TO EXCEL
  =============================== */
  const exportExcel = () => {
    const data = filteredVoices.map(v => ({
      File_Name: v.file_name,
      File_Path: v.file_path,
      Language: v.language,
      Created_At: v.createdAt
        ? new Date(v.createdAt).toLocaleString()
        : "-"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "IVR Voices");

    const buffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buffer]), "ivr_voices.xlsx");
  };

  /* ===============================
     PLAY VOICE
  =============================== */
const handlePlayVoice = (id) => {
  try {
    const audio = new Audio(`${baseURL}/ivr/voices/${id}/audio`);
    audio.play().catch(err => {
      console.error("Play failed:", err);
      alert("Click again to play audio");
    });
  } catch (err) {
    console.error(err);
  }
};

  /* ===============================
     DELETE
  =============================== */
  const confirmDelete = async () => {
    await fetch(`${baseURL}/ivr/voices/${voiceToDelete}`, { method: "DELETE" });
    setShowDeleteModal(false);
    fetchVoices();
  };

  return (
    <div className="user-table-container">
      <h2>IVR Voice Library</h2>

      {/* ================= FILTER & ACTIONS ================= */}
      <div className="voice-controls">
        <input
          className="voice-search"
          placeholder="Search file name, language, path..."
          value={searchText}
          onChange={e => {
            setSearchText(e.target.value);
            setCurrentPage(1);
          }}
        />

        <div className="voice-buttons">
          <button className="btn btn-excel" onClick={exportExcel}>
            <FaFileExcel /> Export Excel
          </button>

          <button
            className="btn btn-primary"
            onClick={() => {
              setEditing(false);
              setFileName("");
              setFile(null);
              setShowModal(true);
            }}
          >
            Add New Voice
          </button>
        </div>
      </div>

      {/* ================= TABLE ================= */}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Path</th>
              <th>Language</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedVoices.length > 0 ? (
              paginatedVoices.map(v => (
                <tr key={v.id}>
                  <td>{v.file_name}</td>
                  <td>{v.file_path}</td>
                  <td>{v.language}</td>
                  <td>
                    <button onClick={() => handlePlayVoice(v.id)} className="play-icon">
                      <FaPlay />
                    </button>
                    <button
                      onClick={() => {
                        setEditing(true);
                        setCurrentVoice(v);
                        setFileName(v.file_name);
                        setVoiceLanguage(v.language);
                        setShowModal(true);
                      }}
                      className="edit-icon"
                    >
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => {
                        setVoiceToDelete(v.id);
                        setShowDeleteModal(true);
                      }}
                      className="delete-icon"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="no-results">
                  No voices found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      )}

      {/* ================= PAGINATION ================= */}
      <div className="voice-pagination">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(p => p + 1)}
        >
          Next
        </button>
      </div>
{/* ================= ADD / EDIT MODAL ================= */}
{showModal && (
  <div className="modal">
    <div className="modal-content">
      <h3>{editing ? "Edit Voice" : "Create Voice"}</h3>

      <form onSubmit={editing ? handleUpdateVoice : handleCreateVoice}>
        <div>
          <label>File Name</label>
          <input
            type="text"
            value={fileName}
            onChange={e => setFileName(e.target.value)}
            required
          />
        </div>

        {!editing && (
          <>
            <div>
              <label>Voice File</label>
              <input
                type="file"
                accept="audio/mp3,audio/wav"
                onChange={e => setFile(e.target.files[0])}
                required
              />
            </div>

            <div>
              <label>Language</label>
              <select
                value={voiceLanguage}
                onChange={e => setVoiceLanguage(e.target.value)}
              >
                <option value="english">English</option>
                <option value="swahili">Swahili</option>
              </select>
            </div>
          </>
        )}

        <div className="modal-footer">
          <button type="submit">
            {editing ? "Update Voice" : "Create Voice"}
          </button>
          <button
            type="button"
            className="cancel"
            onClick={() => setShowModal(false)}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {/* ================= DELETE MODAL ================= */}
      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Delete this voice?</h3>
            <button onClick={confirmDelete}>Yes</button>
            <button onClick={() => setShowDeleteModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
