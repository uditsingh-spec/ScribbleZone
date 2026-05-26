import React from 'react';

const COLORS = [
  '#000000', '#ffffff', '#ff0000', '#ff6600', '#ffff00',
  '#00ff00', '#0000ff', '#9900ff', '#ff00ff', '#00ffff',
  '#8B4513', '#FFA500', '#FFB6C1', '#90EE90', '#ADD8E6',
  '#808080', '#C0C0C0', '#800000', '#006400', '#000080',
];

interface Props {
  color: string;
  setColor: (c: string) => void;
  brushSize: number;
  setBrushSize: (s: number) => void;
  onUndo: () => void;
  onClear: () => void;
  isDrawer: boolean;
}

const DrawingTools: React.FC<Props> = ({
  color, setColor, brushSize, setBrushSize, onUndo, onClear, isDrawer,
}) => {
  if (!isDrawer) return null;

  return (
    <div className="drawing-tools">
      <div className="color-palette">
        {COLORS.map((c) => (
          <div
            key={c}
            className={`color-swatch ${color === c ? 'active' : ''}`}
            style={{ backgroundColor: c }}
            onClick={() => setColor(c)}
            title={c}
          />
        ))}
      </div>

      <div className="tool-divider" />

      <div className="brush-controls">
        <input
          type="range"
          min={1}
          max={30}
          step={1}
          value={brushSize}
          onChange={(e) => setBrushSize(Number(e.target.value))}
        />
        <div
          className="brush-preview"
          style={{
            width: Math.max(brushSize, 6),
            height: Math.max(brushSize, 6),
            backgroundColor: color,
          }}
        />
      </div>

      <div className="tool-divider" />

      <div className="tool-buttons">
        <button className="btn-icon" onClick={onClear} title="Clear">
          🧹
        </button>
        <button className="btn-icon" onClick={onUndo} title="Undo">
          ↩️
        </button>
        <button className="btn-icon" onClick={() => setColor('#ffffff')} title="Eraser">
          ⬜
        </button>
      </div>
    </div>
  );
};

export default DrawingTools;
