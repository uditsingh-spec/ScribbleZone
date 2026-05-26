export interface Player {
  id: string;
  name: string;
  score: number;
  hasGuessed: boolean;
  isDrawing: boolean;
  isSpectator: boolean;
  avatar: string;
}

export interface RoomSettings {
  maxPlayers: number;
  rounds: number;
  drawTime: number;
  wordCount: number;
  hints: number;
  wordMode: 'normal' | 'hidden' | 'combination';
  isPrivate: boolean;
  customWords: string[];
}

export interface RoomState {
  id: string;
  hostId: string;
  phase: 'lobby' | 'word_selection' | 'drawing' | 'round_end' | 'game_over';
  settings: RoomSettings;
  players: Player[];
  spectators: Player[];
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  isGuess: boolean;
  isSystem: boolean;
  isCorrect: boolean;
}

export interface Stroke {
  type: 'start' | 'move' | 'end';
  x?: number;
  y?: number;
  color?: string;
  size?: number;
}
