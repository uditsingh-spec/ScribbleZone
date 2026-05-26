import { useState, useEffect, useCallback } from 'react';
import socket from './socket';
import type { RoomState, ChatMessage, Player, Stroke } from './types';
import Home from './pages/Home';
import Lobby from './pages/Lobby';
import Canvas from './components/Canvas';
import Chat from './components/Chat';
import PlayerList from './components/PlayerList';
import Timer from './components/Timer';
import HintDisplay from './components/HintDisplay';
import WordSelector from './components/WordSelector';
import DrawingTools from './components/DrawingTools';
import RoundEnd from './components/RoundEnd';
import GameOver from './components/GameOver';
import './styles/global.css';

function App() {
  // ── Core state ───────────────────────
  const [page, setPage] = useState<'home' | 'lobby' | 'game'>('home');
  const [myId, setMyId] = useState('');
  const [myName, setMyName] = useState('');
  const [room, setRoom] = useState<RoomState | null>(null);

  // ── Game state ───────────────────────
  const [round, setRound] = useState(0);
  const [drawerId, setDrawerId] = useState('');
  const [wordOptions, setWordOptions] = useState<string[]>([]);
  const [currentWord, setCurrentWord] = useState('');
  const [currentHint, setCurrentHint] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [scores, setScores] = useState<Player[]>([]);
  const [strokeHistory, setStrokeHistory] = useState<Stroke[]>([]);
  const [winner, setWinner] = useState<Player | null>(null);
  const [leaderboard, setLeaderboard] = useState<Player[]>([]);

  // ── Canvas control ───────────────────
  const [externalStroke, setExternalStroke] = useState<Stroke | null>(null);
  const [clearCount, setClearCount] = useState(0);
  const [undoStrokeHistory, setUndoStrokeHistory] = useState<Stroke[] | null>(null);

  // ── Drawing tools state ──────────────
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushSize, setBrushSize] = useState(5);

  // ── URL room code ────────────────────
  const urlRoomCode = new URLSearchParams(window.location.search).get('room') || '';

  // ── Derived ──────────────────────────
  const isDrawer = myId === drawerId;
  const myPlayer = room?.players.find(p => p.id === myId) || room?.spectators.find(p => p.id === myId);
  const isSpectator = myPlayer?.isSpectator ?? false;

  // ── Socket listeners ─────────────────
  useEffect(() => {
    const onConnect = () => setMyId(socket.id || '');

    const onRoomCreated = (data: RoomState) => {
      setRoom(data);
      setPage('lobby');
    };

    const onRoomJoined = (data: RoomState) => {
      setRoom(data);
      setPage('lobby');
    };

    const onPlayerJoined = (data: { player: Player; players: Player[] }) => {
      setRoom(prev => prev ? { ...prev, players: data.players } : prev);
      setMessages(prev => [...prev, {
        playerId: '', playerName: '', isGuess: false, isSystem: true, isCorrect: false,
        text: `${data.player.name} joined the room`,
      }]);
    };

    const onPlayerLeft = (data: { playerId: string; players: Player[] }) => {
      setRoom(prev => prev ? { ...prev, players: data.players } : prev);
      setMessages(prev => [...prev, {
        playerId: '', playerName: '', isGuess: false, isSystem: true, isCorrect: false,
        text: `A player left the room`,
      }]);
    };

    const onGameState = (data: Partial<RoomState> & { hint?: string; drawTime?: number }) => {
      setRoom(prev => {
        if (!prev) return prev;
        return { ...prev, phase: data.phase || prev.phase, players: data.players || prev.players };
      });
      if (data.hint !== undefined) setCurrentHint(data.hint);
    };

    const onRoundStart = (data: { drawerId: string; wordOptions: string[]; drawTime: number; round: number }) => {
      setRound(data.round);
      setDrawerId(data.drawerId);
      setWordOptions(data.wordOptions);
      setCurrentWord('');
      setCurrentHint('');
      setTimeRemaining(data.drawTime);
      setMessages([]);
      setClearCount(c => c + 1);
      setPage('game');
    };

    const onTimerTick = (data: { remaining: number }) => setTimeRemaining(data.remaining);
    const onHintUpdate = (data: { hint: string }) => setCurrentHint(data.hint);

    const onDrawData = (data: Stroke) => setExternalStroke({ ...data });
    const onCanvasCleared = () => setClearCount(c => c + 1);
    const onDrawUndo = (data: { strokeHistory: Stroke[] }) => setUndoStrokeHistory([...data.strokeHistory]);

    const onGuessResult = (data: { correct: boolean; playerId: string; playerName: string; points: number }) => {
      if (data.correct) {
        setMessages(prev => [...prev, {
          playerId: data.playerId, playerName: data.playerName,
          text: `${data.playerName} guessed the word! +${data.points} pts`,
          isGuess: false, isSystem: false, isCorrect: true,
        }]);
        // Update player hasGuessed in room state
        setRoom(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            players: prev.players.map(p =>
              p.id === data.playerId ? { ...p, hasGuessed: true } : p
            ),
          };
        });
      }
    };

    const onChatMessage = (data: { playerId: string; playerName: string; text: string; isGuess: boolean }) => {
      setMessages(prev => [...prev, {
        ...data, isSystem: false, isCorrect: false,
      }]);
    };

    const onRoundEnd = (data: { word: string; scores: Player[]; strokeHistory: Stroke[] }) => {
      setCurrentWord(data.word);
      setScores(data.scores);
      setStrokeHistory(data.strokeHistory);
      setWordOptions([]);
      setRoom(prev => prev ? { ...prev, phase: 'round_end' } : prev);
    };

    const onGameOver = (data: { winner: Player; leaderboard: Player[] }) => {
      setWinner(data.winner);
      setLeaderboard(data.leaderboard);
      setWordOptions([]);
      setRoom(prev => prev ? { ...prev, phase: 'game_over' } : prev);
    };

    const onKicked = (data: { message: string }) => {
      alert(data.message);
      setPage('home');
      setRoom(null);
      socket.disconnect();
    };

    const onError = (data: { message: string }) => alert(data.message);

    const onVotekickUpdate = (data: { targetId: string; votes: number; needed: number }) => {
      setMessages(prev => [...prev, {
        playerId: '', playerName: '', isGuess: false, isSystem: true, isCorrect: false,
        text: `Votekick: ${data.votes}/${data.needed} votes`,
      }]);
    };

    socket.on('connect', onConnect);
    socket.on('room_created', onRoomCreated);
    socket.on('room_joined', onRoomJoined);
    socket.on('player_joined', onPlayerJoined);
    socket.on('player_left', onPlayerLeft);
    socket.on('game_state', onGameState);
    socket.on('round_start', onRoundStart);
    socket.on('timer_tick', onTimerTick);
    socket.on('hint_update', onHintUpdate);
    socket.on('draw_data', onDrawData);
    socket.on('canvas_cleared', onCanvasCleared);
    socket.on('draw_undo', onDrawUndo);
    socket.on('guess_result', onGuessResult);
    socket.on('chat_message', onChatMessage);
    socket.on('round_end', onRoundEnd);
    socket.on('game_over', onGameOver);
    socket.on('kicked', onKicked);
    socket.on('error', onError);
    socket.on('votekick_update', onVotekickUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('room_created', onRoomCreated);
      socket.off('room_joined', onRoomJoined);
      socket.off('player_joined', onPlayerJoined);
      socket.off('player_left', onPlayerLeft);
      socket.off('game_state', onGameState);
      socket.off('round_start', onRoundStart);
      socket.off('timer_tick', onTimerTick);
      socket.off('hint_update', onHintUpdate);
      socket.off('draw_data', onDrawData);
      socket.off('canvas_cleared', onCanvasCleared);
      socket.off('draw_undo', onDrawUndo);
      socket.off('guess_result', onGuessResult);
      socket.off('chat_message', onChatMessage);
      socket.off('round_end', onRoundEnd);
      socket.off('game_over', onGameOver);
      socket.off('kicked', onKicked);
      socket.off('error', onError);
      socket.off('votekick_update', onVotekickUpdate);
    };
  }, []);

  // ── Socket emitters ──────────────────
  const handleDrawStart = useCallback((d: { x: number; y: number; color: string; size: number }) => {
    socket.emit('draw_start', d);
  }, []);
  const handleDrawMove = useCallback((d: { x: number; y: number }) => {
    socket.emit('draw_move', d);
  }, []);
  const handleDrawEnd = useCallback(() => {
    socket.emit('draw_end', {});
  }, []);
  const handleUndo = useCallback(() => {
    socket.emit('draw_undo', {});
  }, []);
  const handleClear = useCallback(() => {
    socket.emit('canvas_clear', {});
  }, []);
  const handleGuess = useCallback((text: string) => {
    socket.emit('guess', { text });
  }, []);
  const handleChat = useCallback((text: string) => {
    socket.emit('chat', { text });
  }, []);
  const handleKick = useCallback((targetId: string) => {
    socket.emit('kick_player', { targetId });
  }, []);
  const handleVotekick = useCallback((targetId: string) => {
    socket.emit('votekick', { targetId });
  }, []);

  // ── Render ───────────────────────────
  if (page === 'home') {
    return <Home initialRoomCode={urlRoomCode} />;
  }

  if (page === 'lobby' && room) {
    return <Lobby room={room} myId={myId} />;
  }

  if (page === 'game' && room) {
    // Round end overlay
    if (room.phase === 'round_end') {
      return <RoundEnd word={currentWord} scores={scores} strokeHistory={strokeHistory} />;
    }

    // Game over overlay
    if (room.phase === 'game_over') {
      return (
        <GameOver
          winner={winner}
          leaderboard={leaderboard}
          isHost={myId === room.hostId}
        />
      );
    }

    // Active game layout
    const drawTime = room.settings.drawTime;

    return (
      <div className="game-layout page-bg game-bg">
        {/* Left sidebar */}
        <div className="game-sidebar-left card">
          <PlayerList
            players={room.players}
            spectators={room.spectators}
            myId={myId}
            hostId={room.hostId}
            phase={room.phase}
            onKick={handleKick}
            onVotekick={handleVotekick}
          />
        </div>

        {/* Center */}
        <div className="game-center">
          <div className="game-top-bar card">
            <div className="round-badge">ROUND {round}/{room.settings.rounds}</div>
            <HintDisplay
              hint={currentHint}
              phase={room.phase}
              isDrawer={isDrawer}
              currentWord={currentWord}
            />
            <Timer timeRemaining={timeRemaining} drawTime={drawTime} />
          </div>

          <div className="canvas-area">
            {/* Word selector overlay for drawer */}
            {wordOptions.length > 0 && isDrawer && (
              <WordSelector
                wordOptions={wordOptions}
                onSelect={(w) => { setCurrentWord(w); setWordOptions([]); }}
              />
            )}

            <Canvas
              isDrawer={isDrawer && !isSpectator}
              color={brushColor}
              brushSize={brushSize}
              onDrawStart={handleDrawStart}
              onDrawMove={handleDrawMove}
              onDrawEnd={handleDrawEnd}
              externalStroke={externalStroke}
              shouldClear={clearCount}
              undoStrokeHistory={undoStrokeHistory}
            />

            {isDrawer && !isSpectator && (
              <DrawingTools
                color={brushColor}
                setColor={setBrushColor}
                brushSize={brushSize}
                setBrushSize={setBrushSize}
                onUndo={handleUndo}
                onClear={handleClear}
                isDrawer={isDrawer}
              />
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="game-sidebar-right card">
          <Chat
            messages={messages}
            onSendGuess={handleGuess}
            onSendChat={handleChat}
            isDrawer={isDrawer}
            phase={room.phase}
            isSpectator={isSpectator}
          />
        </div>
      </div>
    );
  }

  return null;
}

export default App;
