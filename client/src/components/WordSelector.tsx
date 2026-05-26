import React, { useState, useEffect } from 'react';
import socket from '../socket';

interface Props {
  wordOptions: string[];
  onSelect: (word: string) => void;
}

const WordSelector: React.FC<Props> = ({ wordOptions, onSelect }) => {
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    setTimeLeft(10);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [wordOptions]);

  if (wordOptions.length === 0) return null;

  const handleSelect = (word: string) => {
    socket.emit('word_chosen', { word });
    onSelect(word);
  };

  return (
    <div className="word-selector-overlay">
      <div className="card word-selector-card animate-bounce-in">
        <h2 className="title">PICK A WORD! ✏️</h2>
        <div className={`countdown ${timeLeft < 3 ? 'animate-shake' : ''}`}>{timeLeft}</div>
        <div className="word-options">
          {wordOptions.map((word, index) => (
            <button
              key={word}
              className="card word-option animate-pop"
              style={{ animationDelay: `${index * 100}ms` }}
              onClick={() => handleSelect(word)}
            >
              {word}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WordSelector;
