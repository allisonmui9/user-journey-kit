import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom'
import JourneyPage from './pages/JourneyPage'
import RetroMenuBar from './components/RetroMenuBar'
import ActionNode from './components/flow/ActionNode'
import DecisionNode from './components/flow/DecisionNode'
import EventNode from './components/flow/EventNode'
import OpenQuestion from './components/flow/OpenQuestion'
import { journeys } from './journey'
import { DESKTOP_BG, FONT_IMPORT, HAND_FONT_IMPORT, INK, RETRO_FONT } from './theme'

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

/** A little page with a folded corner — the README sitting on the desktop */
function DocIcon({ size = 64, open = false }: { size?: number; open?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      {/* Page, with the top-right corner turned down */}
      <path
        d="M12 4h28l12 12v44a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        fill={open ? '#fff8e7' : '#fffdf6'}
        stroke={INK}
        strokeWidth="2.5"
      />
      <path d="M40 4v12h12" fill="#ffc94d" stroke={INK} strokeWidth="2.5" />
      {/* Lines of writing */}
      <rect x="18" y="24" width="26" height="2.5" fill="#ff6b9d" />
      <rect x="18" y="32" width="20" height="2.5" fill="#5bc8f5" />
      <rect x="18" y="40" width="24" height="2.5" fill="#7ee787" />
      <rect x="18" y="48" width="14" height="2.5" fill="#c9c6d6" />
    </svg>
  )
}

/** Classic stripey window title bar with the little close box */
function WindowChrome({ title, onClose }: { title: string; onClose?: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 8px',
        borderBottom: `2px solid ${INK}`,
        background: 'repeating-linear-gradient(180deg, #fff 0 2px, #dcd6f7 2px 4px)',
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
      {/* The close box, over on the right — only on windows that can close */}
      {onClose && (
        <button
          onClick={onClose}
          title="Close"
          aria-label={`Close ${title}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '16px',
            height: '16px',
            padding: 0,
            marginLeft: 'auto',
            flexShrink: 0,
            border: `2px solid ${INK}`,
            background: '#5bc8f5',
            color: INK,
            fontFamily: RETRO_FONT,
            fontSize: '13px',
            lineHeight: 1,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      )}
    </div>
  )
}

/**
 * One icon on the desktop: click to select, click again — or double-click — to
 * open. `kind` picks the artwork; journeys get folders, the readme gets a page.
 */
function DesktopIcon({
  title,
  kind = 'folder',
  /** 'click' opens on a second single click too; 'doubleClick' insists on the real thing */
  openOn = 'click',
  onOpen,
}: {
  title: string
  kind?: 'folder' | 'doc'
  openOn?: 'click' | 'doubleClick'
  onOpen: () => void
}) {
  const [selected, setSelected] = useState(false)
  const Icon = kind === 'doc' ? DocIcon : FolderIcon

  return (
    <button
      onClick={() => (selected && openOn === 'click' ? onOpen() : setSelected(true))}
      onDoubleClick={onOpen}
      onBlur={() => setSelected(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        width: '130px',
        padding: '10px 8px',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: RETRO_FONT,
        color: 'inherit',
      }}
    >
      <Icon open={selected} />
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
        {title}
      </span>
    </button>
  )
}

/**
 * The legend: each shape drawn with the very component the diagram uses, with
 * its own explanation lettered inside it. Nothing here describes the notation —
 * it just is the notation.
 */
function ReadmeLegend() {
  return (
    <div
      // A single row that wraps onto a second when the window is narrow
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '10px',
        margin: '0 0 14px 0',
      }}
    >
      <svg width={112} height={56} aria-label="A box means what the user does">
        <EventNode
          cx={56}
          cy={28}
          width={104}
          height={48}
          radius={12}
          label="what the user does"
          maxChars={11}
        />
      </svg>

      <svg width={80} height={80} aria-label="A circle means an outcome">
        {/* maxChars 7 breaks it onto two lines, so it clears the curve */}
        <ActionNode cx={40} cy={40} r={37} label="an outcome" maxChars={7} />
      </svg>

      <svg width={112} height={68} aria-label="A diamond means a fork in the road">
        <DecisionNode cx={56} cy={34} label="a fork" rx={53} ry={31} maxChars={8} />
      </svg>

      <svg width={132} height={26} aria-label="Red text is an open question">
        <OpenQuestion x={2} y={17} width={130} questions={['an open question']} />
      </svg>
    </div>
  )
}

/**
 * The instructions, in a window of their own. Short on purpose — someone opened
 * a prototype, not a manual.
 */
function ReadmeWindow({ onClose }: { onClose: () => void }) {
  // Esc closes it, the way any window on a desktop should
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      // Floats over the journeys window, offset so the one underneath still shows
      style={{
        position: 'fixed',
        top: '132px',
        left: '50%',
        transform: 'translateX(-38%)',
        width: 'min(520px, calc(100vw - 48px))',
        maxHeight: 'calc(100vh - 180px)',
        overflowY: 'auto',
        zIndex: 20,
        background: '#fffdf6',
        border: `2px solid ${INK}`,
        boxShadow: `8px 8px 0 ${INK}`,
        fontSize: '14px',
        lineHeight: 1.5,
      }}
    >
      <WindowChrome title="README" onClose={onClose} />
      <div style={{ padding: '16px' }}>
        <p style={{ margin: '0 0 4px 0', fontSize: '17px', fontWeight: 700 }}>
          A quick how to ✿
        </p>

        <ol style={{ margin: '0 0 14px 0', paddingLeft: '20px' }}>
          <li style={{ marginBottom: '10px' }}>
            Write out your steps inlist format in a text editor.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Paste the steps into Claude to create the user journey.
          </li>
          <li style={{ marginBottom: '10px' }}>
            Make revisions as you see fit!
          </li>
          <li>
            Add visuals or open questions to help you communicate with your stakeholders.
          </li>
        </ol>

        <p style={{ margin: '0 0 6px 0', fontWeight: 700 }}>Reading the drawing</p>
        <ReadmeLegend />

      </div>
    </div>
  )
}

/** The desktop: one window of icons, plus the readme when it's open. */
function HomePage() {
  const navigate = useNavigate()
  const only = journeys.length === 1 ? journeys[0] : null
  const [readmeOpen, setReadmeOpen] = useState(false)

  return (
    <div style={{ minHeight: '100vh', fontFamily: RETRO_FONT, color: INK, background: DESKTOP_BG }}>
      <style>{`${FONT_IMPORT}${HAND_FONT_IMPORT}`}</style>

      <RetroMenuBar />

      <div style={{ display: 'flex', justifyContent: 'center', padding: '56px 40px' }}>
        <div
          style={{
            width: 'min(720px, 100%)',
            minHeight: '460px',
            display: 'flex',
            flexDirection: 'column',
            background: '#fffdf6',
            border: `2px solid ${INK}`,
            boxShadow: `6px 6px 0 ${INK}`,
          }}
        >
          <WindowChrome title="User Journeys" />
          <div style={{ padding: '16px' }}>
            <p style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 700 }}>
              {only ? only.title : 'Journeys'}
            </p>
            <p style={{ margin: '0 0 16px 0', fontSize: '14px' }}>
              {only?.subtitle ?? 'Open a folder to walk the flow.'}{' '}
              <span style={{ color: '#6b6880' }}>Double-click README for instructions.</span>
            </p>

            {/* The icons live in the window, like a file browser */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {journeys.map((journey) => (
                <DesktopIcon
                  key={journey.slug}
                  title={journey.title}
                  onOpen={() => navigate(`/journey/${journey.slug}`)}
                />
              ))}
              <DesktopIcon
                title="README"
                kind="doc"
                openOn="doubleClick"
                onOpen={() => setReadmeOpen(true)}
              />
            </div>
          </div>
        </div>

        {readmeOpen && <ReadmeWindow onClose={() => setReadmeOpen(false)} />}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/journey/:slug" element={<JourneyPage />} />
      </Routes>
    </Router>
  )
}
