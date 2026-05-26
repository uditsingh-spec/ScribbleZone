import React, { useRef, useEffect, useState } from 'react';
import type { Player, Stroke } from '../types';
import AvatarDisplay from './AvatarDisplay';

interface Props {
  word: string;
  scores: Player[];
  strokeHistory: Stroke[];
}

const RoundEnd: React.FC<Props> = ({ word, scores, strokeHistory }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(5);
  const [animatedScores, setAnimatedScores] = useState<Record<string, number>>({});

  // Replay animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 250);

    let idx = 0;
    const timer = setInterval(() => {
      if (idx >= strokeHistory.length) { clearInterval(timer); return; }
      const s = strokeHistory[idx];
      if (s.type === 'start') {
        ctx.beginPath();
        ctx.moveTo((s.x || 0) * 0.5, (s.y || 0) * 0.5);
        ctx.strokeStyle = s.color || '#000';
        ctx.lineWidth = (s.size || 3) * 0.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (s.type === 'move') {
        ctx.lineTo((s.x || 0) * 0.5, (s.y || 0) * 0.5);
        ctx.stroke();
      } else if (s.type === 'end') {
        ctx.closePath();
      }
      idx++;
    }, 16);

    return () => clearInterval(timer);
  }, [strokeHistory]);

  // Countdown
  useEffect(() => {
    const t = setInterval(() => setCountdown(p => Math.max(0, p - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let tick = 0;
    const steps = 24;
    setAnimatedScores(Object.fromEntries(scores.map(p => [p.id, 0])));

    const t = setInterval(() => {
      tick++;
      const progress = Math.min(tick / steps, 1);
      setAnimatedScores(Object.fromEntries(
        scores.map(p => [p.id, Math.round(p.score * progress)])
      ));
      if (progress >= 1) clearInterval(t);
    }, 30);

    return () => clearInterval(t);
  }, [scores]);

  return (
    <div className="overlay-screen">
      <div className="card overlay-card animate-bounce-in">
        <h1 className="round-title">ROUND OVER! 🎨</h1>
        <div className="word-reveal">
          <div className="label">The word was...</div>
          <div className="word">{word}</div>
        </div>
        <div className="card replay-canvas">
          <canvas ref={canvasRef} width={400} height={250} />
        </div>
        <table className="scores-table">
          <thead>
            <tr><th>#</th><th></th><th>Player</th><th>Score</th></tr>
          </thead>
          <tbody>
            {scores.map((p, i) => (
              <tr key={p.id} className={i === 0 ? 'top-scorer' : ''}>
                <td className="rank">{i === 0 ? '👑' : i + 1}</td>
                <td><AvatarDisplay avatar={p.avatar} name={p.name} size={28} /></td>
                <td>{p.name}</td>
                <td className="score-cell">{animatedScores[p.id] ?? p.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="countdown-text">Next round in {countdown}s...</div>
      </div>
    </div>
  );
};

export default RoundEnd;
