import React from 'react';
import type { Player } from '../types';
import AvatarDisplay from './AvatarDisplay';

interface Props {
  players: Player[];
  spectators: Player[];
  myId: string;
  hostId: string;
  phase: string;
  onKick: (targetId: string) => void;
  onVotekick: (targetId: string) => void;
}

const PlayerList: React.FC<Props> = ({
  players, spectators, myId, hostId, phase, onKick, onVotekick,
}) => {
  const isHost = myId === hostId;
  const inGame = phase === 'drawing' || phase === 'word_selection';

  return (
    <div className="player-list">
      <h3>PLAYERS</h3>
      {players.map((p, i) => (
        <div
          key={p.id}
          className={`player-item animate-bounce-in ${p.isDrawing ? 'is-drawing animate-pulse-glow' : ''} ${p.hasGuessed ? 'has-guessed' : ''}`}
          style={{ animationDelay: `${i * 45}ms` }}
        >
          <AvatarDisplay avatar={p.avatar} name={p.name} size={36} />
          <div className="player-info">
            <div className="name">
              {p.name}
              {p.id === myId && <span className="tag"> (You)</span>}
              {p.id === hostId && <span className="tag"> ★</span>}
            </div>
          </div>
          <div className="player-status">
            {p.isDrawing ? '✏️' : p.hasGuessed ? '✅' : ''}
          </div>
          <div className="player-score">{p.score}</div>
          <div className="player-actions">
            {isHost && p.id !== myId && (
              <button className="btn btn-danger btn-sm" onClick={() => onKick(p.id)}>✕</button>
            )}
            {!isHost && p.id !== myId && inGame && (
              <button className="btn btn-secondary btn-sm" onClick={() => onVotekick(p.id)} title="Votekick">⚑</button>
            )}
          </div>
        </div>
      ))}

      {spectators.length > 0 && (
        <>
          <h3 className="spectators-heading">👁 Spectators</h3>
          {spectators.map((s) => (
            <div key={s.id} className="player-item animate-bounce-in">
              <AvatarDisplay avatar={s.avatar} name={s.name} size={28} />
              <div className="player-info">
                <div className="name">{s.name} <span className="tag">(Spectator)</span></div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};

export default PlayerList;
