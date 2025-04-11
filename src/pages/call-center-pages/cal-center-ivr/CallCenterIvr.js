import React, { useState, useEffect } from "react";
import { baseURL } from "../../../config";
import "./callCenterIvr.css";

export default function CallCenterIvr() {
  const [voices, setVoices] = useState([]);
  const [fileName, setFileName] = useState("");
  const [file, setFile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [currentVoice, setCurrentVoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [voiceToDelete, setVoiceToDelete] = useState(null);

  useEffect(() => {
    fetchVoices();
  }, []);

  const fetchVoices = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseURL}/ivr/voices`);
      const data = await response.json();
      setVoices(data);
    } catch (error) {
      console.error("Error fetching voices:", error);
    }
    setLoading(false);
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    // const allowedTypes = ["audio/mp3", "audio/wav"];
    const maxSize = 10 * 1024 * 1024;

    // if (!allowedTypes.includes(selectedFile.type)) {
    //   alert("Only audio files are allowed");
    //   return;
    // }

    if (selectedFile.size > maxSize) {
      alert("File size exceeds the limit of 10MB");
      return;
    }

    setFile(selectedFile);
  };

  const handleFileNameChange = (e) => {
    setFileName(e.target.value);
  };

  const handleCreateVoice = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("voice_file", file);
    formData.append("file_name", fileName);

    try {
      await fetch(`${baseURL}/ivr/voices`, {
        method: "POST",
        body: formData,
      });
      fetchVoices();
      setFileName("");
      setFile(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error creating voice:", error);
    }
  };

  const handleEditVoice = (voice) => {
    setEditing(true);
    setCurrentVoice(voice);
    setFileName(voice.file_name);
    setShowModal(true);
  };

  const handleUpdateVoice = async (e) => {
    e.preventDefault();

    const updatedVoice = {
      file_name: fileName,
      file_path: currentVoice.file_path,
    };

    try {
      await fetch(`${baseURL}/ivr/voices/${currentVoice.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedVoice),
      });
      fetchVoices();
      setEditing(false);
      setCurrentVoice(null);
      setFileName("");
      setFile(null);
      setShowModal(false);
    } catch (error) {
      console.error("Error updating voice:", error);
    }
  };

  const handleDeleteVoice = (id) => {
    setVoiceToDelete(id);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    try {
      await fetch(`${baseURL}/ivr/voices/${voiceToDelete}`, {
        method: "DELETE",
      });
      fetchVoices();
      setShowDeleteModal(false);
    } catch (error) {
      console.error("Error deleting voice:", error);
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
  };

  return (
    <div className="user-table-container">
      <h2>Call Center IVR Dashboard</h2>

      <button
        onClick={() => {
          setEditing(false);
          setFileName("");
          setFile(null);
          setShowModal(true);
        }}
        style={{
          position: "absolute",
          right: "20px",
          padding: "10px 20px",
          backgroundColor: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        Add New IVR
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>{editing ? "Edit Voice" : "Create Voice"}</h3>
            <form onSubmit={editing ? handleUpdateVoice : handleCreateVoice}>
              <div>
                <label>File Name:</label>
                <input
                  type="text"
                  value={fileName}
                  onChange={handleFileNameChange}
                  required
                />
              </div>
              {!editing && (
                <div>
                  <label>File:</label>
                  <input
                    type="file"
                    name="voice_file"
                    onChange={handleFileChange}
                    required
                  />
                </div>
              )}
              <button type="submit">
                {editing ? "Update Voice" : "Create Voice"}
              </button>
            </form>
          </div>
        </div>
      )}

      <h3>Voice Entries</h3>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <table className="user-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>File Path</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {voices.map((voice) => (
              <tr key={voice.id}>
                <td>{voice.file_name}</td>
                <td>{voice.file_path}</td>
                <td>
                  <button onClick={() => handleEditVoice(voice)}>Edit</button>
                  <button onClick={() => handleDeleteVoice(voice.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showDeleteModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Are you sure you want to delete this voice entry?</h3>
            <button onClick={confirmDelete}>Yes, Delete</button>
            <button onClick={cancelDelete}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}
