import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Add a log message and scroll to the bottom of the console
  const addLog = (message: string) => {
    setLogs(prevLogs => [...prevLogs, `> ${message}`]);
  };

  // Auto-scroll when new logs are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Handle the "Spawn Scraper" button click
  const handleSpawnScraper = async () => {
    try {
      setLoading(true);
      addLog('Requesting new scraper instance...');
      
      const response = await axios.post('http://localhost:8000/spawn');
      
      addLog(response.data.message);
      addLog('Scraper instance started successfully!');
    } catch (error) {
      if (axios.isAxiosError(error)) {
        addLog(`Error: ${error.message}`);
        if (error.response) {
          addLog(`Server responded with: ${JSON.stringify(error.response.data)}`);
        }
      } else {
        addLog('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container">
      <header>
        <h1>MetaBundle Scraper Dashboard</h1>
      </header>
      
      <main>
        <div className="control-panel">
          <button 
            onClick={handleSpawnScraper} 
            disabled={loading}
            className="spawn-button"
          >
            {loading ? 'Spawning...' : 'Spawn Scraper'}
          </button>
        </div>
        
        <div className="console-container">
          <h2>Console:</h2>
          <div className="console" ref={consoleRef}>
            {logs.length === 0 ? (
              <div className="empty-console">No logs yet. Click "Spawn Scraper" to begin.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="log-line">{log}</div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
