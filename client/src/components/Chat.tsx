import React, { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types';
import socket from '../socket';

interface Props {
  messages: ChatMessage[];
  onSendGuess: (text: string) => void;
  onSendChat: (text: string) => void;
  isDrawer: boolean;
  phase: string;
  isSpectator: boolean;
}

const Chat: React.FC<Props> = ({ messages, onSendGuess, onSendChat, isDrawer, phase, isSpectator }) => {
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    if (phase === 'drawing' && !isDrawer && !isSpectator) {
      onSendGuess(text);
    } else {
      onSendChat(text);
    }
    setInput('');
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const inputDisabled = (isDrawer && phase === 'drawing') || isSpectator;
  const placeholder = isSpectator
    ? 'Spectating...'
    : isDrawer && phase === 'drawing'
      ? 'You are drawing...'
      : 'Type your guess...';

  return (
    <div className="chat-container">
      <div className="chat-header">CHAT 💬</div>
      <div className="chat-messages">
        {messages.map((msg, i) => {
          const isSelf = msg.playerId === socket.id;
          let cls = 'chat-msg msg-bubble';
          if (msg.isCorrect) cls += ' msg-correct correct';
          else if (msg.isSystem) cls += ' msg-system system';
          else cls += isSelf ? ' msg-self' : ' msg-other';
          if (msg.isGuess) cls += ' guess';

          return (
            <div key={i} className={cls}>
              {msg.isSystem || msg.isCorrect ? (
                msg.isCorrect ? `🎉 ${msg.text}` : msg.text
              ) : (
                <>
                  <span className="sender">{msg.playerName}: </span>
                  {msg.text}
                </>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-area">
        <input
          className="input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder={placeholder}
          disabled={inputDisabled}
        />
        <button className="btn btn-accent btn-sm" onClick={handleSend} disabled={inputDisabled}>
          ✈️
        </button>
      </div>
    </div>
  );
};

export default Chat;
