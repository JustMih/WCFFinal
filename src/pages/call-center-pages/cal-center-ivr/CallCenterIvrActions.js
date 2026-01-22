import React, { useEffect, useState } from "react";
import { baseURL } from "../../../config";

const DTMF_KEYS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9","10"];

export default function CallCenterIvrActions() {
  const [voices, setVoices] = useState([]);
  const [actions, setActions] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");
  const [dtmfMappings, setDtmfMappings] = useState([]);
  const [processedMappings, setProcessedMappings] = useState([]);
  const [showMappings, setShowMappings] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [language, setLanguage] = useState("english");
  const [menuContext, setMenuContext] = useState("");  // NEW
  const MENU_CONTEXT_OPTIONS = ["english-menu", "swahili-menu", "general", "inbound"]; // Extend as needed
  
  // Fetch voices and actions
  useEffect(() => {
    fetch(`${baseURL}/ivr/voices`)
      .then(res => res.json())
      .then(data => setVoices(data));

    fetch(`${baseURL}/ivr-actions`)
      .then(res => res.json())
      .then(data => setActions(data.ivrAction));
  }, []);

  // When voice is selected
  useEffect(() => {
    if (selectedVoice) {
      setDtmfMappings(
        DTMF_KEYS.map(key => ({
          dtmf_digit: key,
          action_id: "",
          parameter: "",
          language: "",
        }))
      );

      // fetch(`${baseURL}/ivr/dtmf-mappings/${selectedVoice}`)
      fetch(`${baseURL}/ivr/dtmf-mappings/${selectedVoice}?language=${language}`)

        .then(res => res.json())
        .then(data => {
          console.log("Fetched Mappings for selected voice:", data);
 
const INVALID_ACTION_ID = actions.find(a => a.name.toLowerCase().includes("invalid"))?.id || "";

const filledMappings = DTMF_KEYS.map(key => {
  const existing = data.find(m => m.dtmf_digit === key);
  return existing
    ? { dtmf_digit: key, action_id: existing.action_id, parameter: existing.parameter }
    : { dtmf_digit: key, action_id: INVALID_ACTION_ID, parameter: "" };
});

          setDtmfMappings(filledMappings);

          // Also update processedMappings immediately
          const mapped = data.map(item => {
            const action = actions.find(a => String(a.id) === String(item.action_id));
            return {
              ...item,
              action_name: action ? action.name : "Unknown",
            };
          });

          setProcessedMappings(mapped);
        });
    }
  }, [selectedVoice, actions,language]);

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
      language: language,
      menu_context: menuContext, 
    }));

    try {
      const response = await fetch(`${baseURL}/ivr/dtmf-mappings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mappings: payload }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("✅ Mappings saved successfully!");

        // Refresh mappings
        fetch(`${baseURL}/ivr/dtmf-mappings/${selectedVoice}`)
          .then(res => res.json())
          .then(data => {
            const mapped = data.map(item => {
              const action = actions.find(a => String(a.id) === String(item.action_id));
              return {
                ...item,
                action_name: action ? action.name : "Unknown",
              };
            });
            setProcessedMappings(mapped);
          });
      } else {
        alert("❌ Error saving mappings: " + data.message);
      }
    } catch (error) {
      console.error("Error saving mappings:", error);
    }
  };

  const handleEdit = (item) => {
    setEditItem(item);
  };

   
const saveEdit = async (id) => {
  try {
    const response = await fetch(`${baseURL}/ivr/dtmf-mappings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        dtmf_digit: editItem.dtmf_digit,
        action_id: editItem.action_id,
        parameter: editItem.parameter,
        ivr_voice_id: editItem.ivr_voice_id,
        language: editItem.language,
        menu_context: editItem.menu_context,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(`❌ ${data.message}`);
      return;
    }

    alert("✅ Mapping updated successfully");

   const updated = {
  ...data.mapping,
  action_name: data.mapping.action?.name || "Unknown",
};

setProcessedMappings(prev =>
  prev.map(m => (m.id === id ? updated : m))
);


    setEditItem(null);

  } catch (err) {
    console.error("Edit failed:", err);
  }
};


  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this mapping?")) {
      try {
        const response = await fetch(`${baseURL}/ivr/dtmf-mappings/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          alert("✅ Mapping deleted!");
          setProcessedMappings(prev => prev.filter(m => m.id !== id));
        } else {
          alert("❌ Error deleting mapping");
        }
      } catch (error) {
        console.error("Error deleting mapping:", error);
      }
    }
  };
const playVoice = (voiceId) => {
  if (!voiceId) {
    alert("No IVR voice selected");
    return;
  }

  const audioUrl = `${baseURL}/ivr/voices/${voiceId}/audio`;

  const audio = new Audio(audioUrl);

  audio.onerror = () => {
    alert("Unable to play IVR audio (file missing or format issue)");
  };

  audio.play().catch(err => {
    console.error("Audio play failed:", err);
  });
};

  return (
    <div className="user-table-container">
      <h2>DTMF IVR Mappings</h2>

      {!showMappings ? (
        <button onClick={() => setShowMappings(true)}>➕ Map IVR</button>
      ) : (
        <>
          <div>
            <label>Select IVR Voice: </label>
            <select
              onChange={e => setSelectedVoice(e.target.value)}
              value={selectedVoice}
            >
              <option value="">-- select --</option>
              {voices.map(voice => (
                <option key={voice.id} value={voice.id}>
                  {voice.file_name}
                </option>
              ))}
            </select>
            <label>Select Language: </label>
            <select value={language} onChange={e => setLanguage(e.target.value)}>
              <option value="english">English</option>
              <option value="swahili">Swahili</option>
            </select>
            <label>Select Menu Context: </label>
          <select value={menuContext} onChange={e => setMenuContext(e.target.value)}>
            <option value="">-- select --</option>
            {MENU_CONTEXT_OPTIONS.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
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
                          onChange={e => handleChange(index, "action_id", e.target.value)}
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
                          onChange={e => handleChange(index, "parameter", e.target.value)}
                        />
                      </td>
       
                    </tr>
                  ))}
                </tbody>
              </table>

              <button onClick={handleSubmit}>💾 Save Mappings</button>
            </>
          )}

          <h3 style={{ marginTop: "30px" }}>Existing Mappings</h3>

        <table className="user-table">
          <thead>
            <tr>
              <th>DTMF</th>
              <th>Action</th>
              <th>Parameter</th>
              <th>IVR Voice</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {processedMappings.map(item => (
              <tr key={item.id}>

                {/* 🔢 DTMF DIGIT */}
                <td>
                  {editItem && editItem.id === item.id ? (
                    <select
                      value={editItem.dtmf_digit}
                      onChange={e =>
                        setEditItem({ ...editItem, dtmf_digit: e.target.value })
                      }
                    >
                      {DTMF_KEYS.map(k => (
                        <option key={k} value={k}>{k}</option>
                      ))}
                    </select>
                  ) : (
                    item.dtmf_digit
                  )}
                </td>

                {/* 🎯 ACTION */}
                <td>
                  {editItem && editItem.id === item.id ? (
                    <select
                      value={editItem.action_id}
                      onChange={e =>
                        setEditItem({ ...editItem, action_id: e.target.value })
                      }
                    >
                      {actions.map(a => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    item.action_name || "Unknown"
                  )}
                </td>

                {/* 🧾 PARAMETER */}
                <td>
                  {editItem && editItem.id === item.id ? (
                    <input
                      type="text"
                      value={editItem.parameter || ""}
                      onChange={e =>
                        setEditItem({ ...editItem, parameter: e.target.value })
                      }
                    />
                  ) : (
                    item.parameter
                  )}
                </td>

                {/* 🔊 IVR VOICE */}
              <td style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    {editItem && editItem.id === item.id ? (
                      <>
                        <select
                          value={editItem.ivr_voice_id}
                          onChange={e =>
                            setEditItem({ ...editItem, ivr_voice_id: e.target.value })
                          }
                        >
                          {voices.map(v => (
                            <option key={v.id} value={v.id}>
                              {v.file_name}
                            </option>
                          ))}
                        </select>

                        {editItem.ivr_voice_id && (
                          <button
                            className="ivr-play-btn"
                            title="Preview selected voice"
                            onClick={() => playVoice(editItem.ivr_voice_id)}
                          >
                            ▶️
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        <span>{item.voice?.file_name || "Unknown"}</span>

                        {item.ivr_voice_id && (
                          <button
                            className="ivr-play-btn"
                            title="Play IVR voice"
                            onClick={() => playVoice(item.ivr_voice_id)}
                          >
                            ▶️
                          </button>
                        )}
                      </>
                    )}
                  </td>



        {/* 💾 ACTION BUTTONS */}
        <td>
          {editItem && editItem.id === item.id ? (
            <>
              <button onClick={() => saveEdit(item.id)}>💾 Save</button>
              <button onClick={() => setEditItem(null)}>❌ Cancel</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditItem(item)}>✏️ Edit</button>
              <button onClick={() => handleDelete(item.id)}>🗑️ Delete</button>
            </>
          )}
        </td>

      </tr>
    ))}
  </tbody>
</table>

        </>
      )}
    </div>
  );
}
