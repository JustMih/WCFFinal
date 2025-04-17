import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";

const DTMF_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

export default function CallCenterIvrActions() {
  const [voices, setVoices] = useState([]);
  const [actions, setActions] = useState([]); // ✅ urekebishaji huu hapa
  const [selectedVoice, setSelectedVoice] = useState("");
  const [dtmfMappings, setDtmfMappings] = useState([]);

  useEffect(() => {
    fetch(`${baseURL}/ivr/voices`)
      .then(res => res.json())
      .then(data => setVoices(data));

    fetch(`${baseURL}/ivr-actions`)
      .then(res => res.json())
      .then(data => setActions(data.ivrAction)); // or `data` if plain array
  }, []);

  useEffect(() => {
    if (selectedVoice) {
      setDtmfMappings(DTMF_KEYS.map(key => ({
        dtmf_digit: key,
        action_id: "",
        parameter: "",
      })));
    }
  }, [selectedVoice]);

  const handleChange = (index, field, value) => {
    const updated = [...dtmfMappings];
    updated[index][field] = value;
    setDtmfMappings(updated);
  };
  

  const handleSubmit = async () => {
    const payload = dtmfMappings.map(m => ({
      dtmf_digit: m.dtmf_digit,
      action_id: m.action_id,
      parameter: m.parameter,
      ivr_voice_id: selectedVoice,
    }));

    try {
      await fetch(`${baseURL}/ivr/dtmf-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload }),
      });
      alert("DTMF mappings saved");
    } catch (error) {
      console.error("Error saving mappings:", error);
    }
  };

  return (
    <div className="user-table-container">
      <h2>DTMF IVR Mappings</h2>

      <div>
        <label>Select IVR Voice: </label>
        <select onChange={e => setSelectedVoice(e.target.value)} value={selectedVoice}>
          <option value="">-- select --</option>
          {voices.map(voice => (
            <option key={voice.id} value={voice.id}>
              {voice.file_name}
            </option>
          ))}
        </select>
      </div>

      {selectedVoice && (
        <>
          <table className="user-table">
            <thead>
              <tr>
                <th>DTMF</th>
                <th>Action</th>
                <th>Parameter</th>
              </tr>
            </thead>
            <tbody>
              {dtmfMappings.map((map, index) => (
                <tr key={map.dtmf_digit}>
                  <td>{map.dtmf_digit}</td>
                  <td>
                    <select
                      value={map.action_id}
                      onChange={(e) => handleChange(index, "action_id", e.target.value)}
                    >
                      <option value="">-- select --</option>
                      {actions.map(action => (
                        <option key={action.id} value={action.id}>
                          {action.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="text"
                      value={map.parameter}
                      onChange={(e) => handleChange(index, "parameter", e.target.value)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button onClick={handleSubmit}>Save Mappings</button>
        </>
      )}
    </div>
  );
}
