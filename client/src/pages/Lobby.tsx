import React from 'react';
import type { RoomState } from '../types';
import AvatarDisplay from '../components/AvatarDisplay';
import socket from '../socket';

interface Props {
  room: RoomState;
  myId: string;
}

const Lobby: React.FC<Props> = ({ room, myId }) => {
  const isHost = myId === room.hostId;

  const copyInvite = () => {
    const url = `${window.location.origin}?room=${room.id}`;
    navigator.clipboard.writeText(url).then(() => alert('Invite link copied!'));
  };

  const handleStart = () => {
    if (room.players.length < 2) return;
    socket.emit('start_game', {});
  };

  const handleKick = (targetId: string) => {
    socket.emit('kick_player', { targetId });
  };

  const s = room.settings;

  return (
    <div className="lobby-container page-bg lobby-bg">
      <div className="card lobby-topbar animate-bounce-in">
        <div className="room-code-section">
          <div className="room-code-label">ROOM CODE:</div>
          <div className="room-code">{room.id}</div>
          <button className="btn btn-accent btn-sm copy-btn" onClick={copyInvite}>
            📋 Copy Invite Link
          </button>
        </div>
        <h1 className="subtitle">Lobby</h1>
      </div>

      <div className="lobby-main">
        <section className="card lobby-panel">
          <h2 className="panel-heading">Players</h2>
          <div className="player-grid">
            {room.players.map((p, i) => (
              <div
                key={p.id}
                className="card lobby-player-card animate-bounce-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <AvatarDisplay avatar={p.avatar} name={p.name} size={56} />
                <span className="player-name">{p.name}</span>
                <div className="player-badges">
                  {p.id === room.hostId && <span className="badge badge-gold">HOST</span>}
                  {p.id === myId && <span className="badge badge-green">YOU</span>}
                </div>
                {isHost && p.id !== myId && (
                  <button className="btn btn-danger btn-sm" onClick={() => handleKick(p.id)}>Kick</button>
                )}
              </div>
            ))}
          </div>

          {room.spectators.length > 0 && (
            <div className="spectators-section">
              <h2 className="panel-heading">👁 Spectators</h2>
              <div className="spectator-grid">
                {room.spectators.map((spectator) => (
                  <div key={spectator.id} className="card spectator-card">
                    <AvatarDisplay avatar={spectator.avatar} name={spectator.name} size={30} />
                    <div>
                      <div>{spectator.name}</div>
                      <div className="spectator-label">👁 Spectator</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {isHost ? (
          <aside className="card settings-panel">
            <h2 className="panel-heading">Game Settings ⚙️</h2>
            <div className="setting-row">
              <label>Max Players</label>
              <input className="input" readOnly value={s.maxPlayers} />
            </div>
            <div className="setting-row">
              <label>Rounds</label>
              <input className="input" readOnly value={s.rounds} />
            </div>
            <div className="setting-row">
              <label>Draw Time</label>
              <input className="input" readOnly value={`${s.drawTime}s`} />
            </div>
            <div className="setting-row">
              <label>Word Count</label>
              <input className="input" readOnly value={s.wordCount} />
            </div>
            <div className="setting-row">
              <label>Hints</label>
              <input className="input" readOnly value={s.hints} />
            </div>
            <div className="setting-row">
              <label>Word Mode</label>
              <input className="input" readOnly value={s.wordMode} />
            </div>
            <div className="setting-row">
              <label>Room</label>
              <input className="input" readOnly value={s.isPrivate ? 'Private' : 'Public'} />
            </div>
            <div className="lobby-actions">
              <button
                className="btn btn-accent btn-large full-width animate-pulse-glow"
                onClick={handleStart}
                disabled={room.players.length < 2}
              >
                {room.players.length < 2 ? 'NEED 2+ PLAYERS' : 'START GAME 🚀'}
              </button>
            </div>
          </aside>
        ) : (
          <aside className="card waiting-panel animate-float">
            <div className="waiting-msg">Waiting for host to start the game...</div>
            <div className="waiting-subtext">Grab a marker. The chaos begins soon.</div>
          </aside>
        )}
      </div>
    </div>
  );
};

export default Lobby;
