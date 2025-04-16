import React, { useState, useRef, useEffect, memo } from 'react';
import axios from 'axios';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const POLL_INTERVAL = parseInt(process.env.REACT_APP_POLL_INTERVAL || '1000', 10);

const MemoHeader = memo(function Header() {
  return (
    <header>
      <h1>MetaBundle Scraper Dashboard</h1>
    </header>
  );
});

const MemoBackendInfo = memo(function BackendInfo({ url }: { url: string }) {
  return <div className="backend-info">Connected to: {url}</div>;
});

interface Message {
  timestamp: string;
  type: string;
  container_id: string;
  message?: string;
  status?: string;
  result?: any;
}

function App() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Add a log message and scroll to the bottom of the console
  const addLog = (message: string) => {
    setLogs(prevLogs => {
      const newLogs = [...prevLogs, `> ${message}`];
      // Cap at 1000 lines
      return newLogs.length > 1000 ? newLogs.slice(newLogs.length - 1000) : newLogs;
    });
  };

  // Auto-scroll when new logs are added
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [logs]);

  // Log backend connection on startup
  useEffect(() => {
    addLog(`Connected to backend at ${BACKEND_URL}`);
    addLog(`Polling for messages every ${POLL_INTERVAL}ms`);
  }, []);

  // Poll for messages from the Scraper-Manager
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await axios.get(`${BACKEND_URL}/messages`);
        const messages: Message[] = response.data.messages || [];
        if (messages.length > lastMessageCount) {
          const newMessages = messages.slice(lastMessageCount);
          newMessages.forEach(message => {
            if (message.type === 'hello') {
              addLog(`[${message.timestamp}] Container ${message.container_id} says: ${message.message}`);
            } else if (message.type === 'complete') {
              addLog(`[${message.timestamp}] Container ${message.container_id} completed with status: ${message.status}`);
              const resultStr = JSON.stringify(message.result, null, 2);
              addLog(`Result: ${resultStr}`);
            }
          });
          setLastMessageCount(messages.length);
        }
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, POLL_INTERVAL);
    return () => clearInterval(pollInterval);
  }, [lastMessageCount]);

  // Handle the "Spawn Scraper" button click
  const handleSpawnScraper = async () => {
    try {
      setLoading(true);
      addLog('Requesting new scraper instance...');
      const response = await axios.post(`${BACKEND_URL}/spawn`);
      if (response.data.container_id) {
        addLog(`Container ID: ${response.data.container_id}`);
      } else if (response.data.message) {
        addLog(response.data.message);
      }
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

  // Handle the "Spawn 10 Instances" button click
  const handleSpawnTen = async () => {
    setLoading(true);
    for (let i = 0; i < 10; i++) {
      await handleSpawnScraper();
    }
    setLoading(false);
  };

  return (
    <div className="app-container">
      <MemoHeader />
      <main>
        <div className="control-panel">
          <button onClick={handleSpawnScraper} disabled={loading} className="spawn-button">
            {loading ? 'Spawning...' : 'Spawn Scraper'}
          </button>
          <button onClick={handleSpawnTen} disabled={loading} className="spawn-button">
            {loading ? 'Spawning...' : 'Spawn 10 Instances'}
          </button>
          <MemoBackendInfo url={BACKEND_URL} />
        </div>
        <div className="console-container">
          <h2>Console:</h2>
          <div className="console" ref={consoleRef} style={{ whiteSpace: 'pre', overflowY: 'auto', height: 400 }}>
            {logs.length === 0 ? (
              <div className="empty-console">No logs yet. Click "Spawn Scraper" to begin.</div>
            ) : (
              logs.join('\n')
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
