// import React, { useEffect, useState } from "react";
// import axios from "axios";

// const RecordedAudio = () => {
//   const [recordings, setRecordings] = useState([]);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     // Fetch the list of recorded files from the backend
//     axios
//       .get("/api/recorded-audio")
//       .then((response) => {
//         setRecordings(response.data); // Assuming backend returns the list of filenames
//       })
//       .catch((err) => {
//         setError("Error fetching recordings.");
//       });
//   }, []);

//   return (
//     <div>
//       <h1>Recorded Audio Files</h1>
//       {error && <p>{error}</p>}
//       <ul>
//         {recordings.map((file, index) => (
//           <li key={index}>
//             <a href={`/api/recorded-audio/${file}`} target="_blank" rel="noopener noreferrer">
//               {file}
//             </a>
//             <audio controls>
//               <source src={`/api/recorded-audio/${file}`} type="audio/wav" />
//               Your browser does not support the audio element.
//             </audio>
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// };

// export default RecordedAudio;
// RecordedAudio.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RecordedAudio = () => {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRecordings = async () => {
      try {
        const response = await axios.get('http://localhost:5070/api/recorded-audio');
        setRecordings(response.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
        console.error('API Error:', err.response?.data);
      }
    };
    
    fetchRecordings();
  }, []);
  if (loading) return <div>Loading recordings...</div>;
  if (error) return <div className="error">Error: {error}</div>;

  return (
    <div>
      <h2>Recorded Calls</h2>
      <ul>
        {recordings.map(rec => (
          <li key={rec.filename}>
            <p>
              {rec.filename} - 
              {new Date(rec.created).toLocaleString()} - 
              {(rec.size / 1024).toFixed(2)} KB
            </p>
            <audio controls>
              <source 
               src={`http://localhost:5070/api/recorded-audio/${encodeURIComponent(rec.filename)}`}
                type="audio/wav" 
              />
            </audio>
          </li>
        ))}
      </ul>
    </div>
  );
};
export default RecordedAudio;