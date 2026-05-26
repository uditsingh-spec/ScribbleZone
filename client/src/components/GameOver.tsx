import React, { useMemo } from 'react';
import type { Player } from '../types';
import AvatarDisplay from './AvatarDisplay';
import socket from '../socket';

interface Props {
  winner: Player | null;
  leaderboard: Player[];
  isHost: boolean;
}

const GameOver: React.FC<Props> = ({ winner, leaderboard, isHost }) => {
  const handlePlayAgain = () => socket.emit('start_game', {});
  const handleLeave = () => { socket.disconnect(); window.location.reload(); };
  const confetti = useMemo(() => {
    const colors = ['#FFD700', '#FF6B6B', '#00E5A0', '#7BDFF2', '#F15BB5', '#ffffff'];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      size: 8 + Math.random() * 8,
      color: colors[i % colors.length],
      delay: Math.random() * 3,
      duration: 4 + Math.random() * 4,
      rotation: 180 + Math.random() * 540,
    }));
  }, []);

  const top3 = leaderboard.slice(0, 3);
  // Reorder for podium display: [2nd, 1st, 3rd]
  const podiumOrder = top3.length >= 3
    ? [top3[1], top3[0], top3[2]]
    : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];

  const barClass = (orig: number) => orig === 0 ? 'first' : orig === 1 ? 'second' : 'third';
  const origIndex = (p: Player) => top3.findIndex(t => t.id === p.id);

  return (
    <div className="page-bg gameover-bg game-over-screen">
      {confetti.map(piece => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={{
            left: `${piece.left}%`,
            width: `${piece.size}px`,
            height: `${piece.size * 0.75}px`,
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
            '--spin': `${piece.rotation}deg`,
          } as React.CSSProperties}
        />
      ))}

      <div className="game-over-content">
        <h1 className="title game-over-title animate-bounce-in">GAME OVER! 🏆</h1>
        {winner && (
          <div className="card winner-card animate-float">
            <div className="trophy">🏆</div>
            <AvatarDisplay avatar={winner.avatar} name={winner.name} size={80} />
            <div className="winner-name">{winner.name}</div>
            <div className="winner-score">{winner.score} points</div>
          </div>
        )}

        <div className="podium">
          {podiumOrder.filter(Boolean).map((p) => {
            const idx = origIndex(p);
            return (
              <div className={`card podium-slot ${barClass(idx)}`} key={p.id}>
                <AvatarDisplay avatar={p.avatar} name={p.name} size={idx === 0 ? 56 : 44} />
                <div className="podium-name">{p.name}</div>
                <div className="podium-score">{p.score} pts</div>
                <div>{idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉'}</div>
              </div>
            );
          })}
        </div>

        <div className="card leaderboard-card">
          <h2 className="panel-heading">Leaderboard</h2>
          <table className="scores-table">
            <thead>
              <tr><th>#</th><th></th><th>Player</th><th>Score</th></tr>
            </thead>
            <tbody>
              {leaderboard.map((p, i) => (
                <tr key={p.id} className={i === 0 ? 'top-scorer' : ''}>
                  <td className="rank">{i + 1}</td>
                  <td><AvatarDisplay avatar={p.avatar} name={p.name} size={28} /></td>
                  <td>{p.name}</td>
                  <td className="score-cell">{p.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="game-over-actions">
          {isHost && (
            <button className="btn btn-accent" onClick={handlePlayAgain}>PLAY AGAIN 🔄</button>
          )}
          <button className="btn btn-secondary" onClick={handleLeave}>LEAVE 🚪</button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;
