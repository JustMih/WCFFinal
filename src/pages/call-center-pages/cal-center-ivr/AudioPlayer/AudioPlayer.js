import React, { useState, useRef, useEffect } from "react";
import "./AudioPlayer.css"; // Create this file if needed

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState("--:--");

  useEffect(() => {
    const updateDuration = () => {
      if (audioRef.current?.duration) {
        setDuration(
          new Date(audioRef.current.duration * 1000)
            .toISOString()
            .substr(14, 5)
        );
      }
    };

    const audio = audioRef.current;
    audio?.addEventListener('loadedmetadata', updateDuration);
    return () => {
      audio?.removeEventListener('loadedmetadata', updateDuration);
    };
  }, [src]);

  const togglePlayback = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play().catch(e => console.error("Playback failed:", e));
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-player-container">
      <audio
        ref={audioRef}
        src={src}
        onEnded={() => setIsPlaying(false)}
        preload="metadata"
      />
      <button onClick={togglePlayback} className="play-button">
        {isPlaying ? '⏸' : '▶'}
      </button>
      <span className="audio-duration">{duration}</span>
    </div>
  );
};

export default AudioPlayer;