import { useState } from 'react'
import EntryFlow from './components/EntryFlow'
import ExitFlow from './components/ExitFlow'
import './App.css'

function App() {
  const [mode, setMode] = useState('entry') // 'entry' or 'exit'

  return (
    <div className="app">
      <header className="app-header">
        <h1>🅿️ Automated Parking Management System</h1>
        <div className="mode-selector">
          <button
            className={mode === 'entry' ? 'active' : ''}
            onClick={() => setMode('entry')}
            aria-label="Entry Mode"
          >
            Entry
          </button>
          <button
            className={mode === 'exit' ? 'active' : ''}
            onClick={() => setMode('exit')}
            aria-label="Exit Mode"
          >
            Exit
          </button>
        </div>
      </header>

      <main className="app-main">
        {mode === 'entry' ? <EntryFlow /> : <ExitFlow />}
      </main>

      <footer className="app-footer">
        <p>© 2024 APMS - Automated Parking Management System</p>
      </footer>
    </div>
  )
}

export default App
