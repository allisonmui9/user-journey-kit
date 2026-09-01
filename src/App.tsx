import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import FlowDiagramPage from './pages/FlowDiagramPage'
import RetroMenuBar from './components/RetroMenuBar'
import { DESKTOP_BG, FONT_IMPORT, INK, RETRO_FONT } from './theme'

/** A colorful folder, drawn rather than emoji so it can carry the retro palette */
function FolderIcon({ size = 64, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {/* Back sheet */}
      <path
        d="M6 18h20l5 6h27a3 3 0 0 1 3 3v27a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V21a3 3 0 0 1 3-3z"
        fill="#f5a524"
        stroke={INK}
        strokeWidth="2.5"
      />
      {/* Papers peeking out */}
      <rect x="14" y="22" width="36" height="18" rx="2" fill="#fff8e7" stroke={INK} strokeWidth="2" />
      <rect x="18" y="26" width="16" height="2.5" fill="#ff6b9d" />
      <rect x="18" y="31" width="24" height="2.5" fill="#5bc8f5" />
      {/* Front flap */}
      <path
        d={
          open
            ? 'M3 30h58l-5 27a3 3 0 0 1-3 2H9a3 3 0 0 1-3-2L3 30z'
            : 'M3 28h58v29a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V28z'
        }
        fill="#ffc94d"
        stroke={INK}
        strokeWidth="2.5"
      />
      {/* Little label sticker */}
      <rect x="24" y="42" width="16" height="8" rx="2" fill="#7ee787" stroke={INK} strokeWidth="2" />
    </svg>
  )
}

/** Classic stripey window title bar with the little close box */
function WindowChrome({ title }: { title: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderBottom: `2px solid ${INK}`,
        background:
          'repeating-linear-gradient(180deg, #fff 0 2px, #dcd6f7 2px 4px)',
      }}
    >
      <span
        style={{
          width: '14px',
          height: '14px',
          border: `2px solid ${INK}`,
          background: '#ff6b9d',
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: RETRO_FONT,
          fontSize: '14px',
          background: '#fff',
          padding: '0 8px',
          border: `2px solid ${INK}`,
        }}
      >
        {title}
      </span>
      <span
        style={{
          width: '14px',
          height: '14px',
          border: `2px solid ${INK}`,
          background: '#5bc8f5',
          marginLeft: 'auto',
          flexShrink: 0,
        }}
      />
    </div>
  )
}

function HomePage() {
  const navigate = useNavigate()
  const [selected, setSelected] = useState(false)

  const open = () => navigate('/user-flow')

  return (
    <div
      style={{
        minHeight: '100vh',
        fontFamily: RETRO_FONT,
        color: INK,
        background: DESKTOP_BG,
      }}
      onClick={() => setSelected(false)}
    >
      <style>{FONT_IMPORT}</style>

      <RetroMenuBar />

      <div style={{ display: 'flex', justifyContent: 'center', padding: '56px 40px' }}>
        {/* Window */}
        <div
          style={{
            width: 'min(720px, 100%)',
            minHeight: '460px',
            display: 'flex',
            flexDirection: 'column',
            height: 'min(1000px, 100%)',
            background: '#fffdf6',
            border: `2px solid ${INK}`,
            boxShadow: `6px 6px 0 ${INK}`,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <WindowChrome title="Atlas Shard Routing" />
          <div style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>
              Shard Routing Tier
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              A prototype of the dedicated mongos flow. Open the folder to walk it.
            </p>

            {/* The folder lives in the window, like a file browser */}
            <button
              onClick={() => setSelected(true)}
              onDoubleClick={open}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                width: '110px',
                padding: '10px 8px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontFamily: RETRO_FONT,
                color: 'inherit',
              }}
            >
              <FolderIcon open={selected} />
              <span
                style={{
                  fontSize: '13px',
                  padding: '2px 6px',
                  background: selected ? INK : '#ffffffdd',
                  color: selected ? '#fff' : INK,
                  border: `2px solid ${INK}`,
                  textAlign: 'center',
                }}
              >
                User Flow
              </span>
            </button>

          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/user-flow" element={<FlowDiagramPage />} />
      </Routes>
    </Router>
  )
}

export default App
