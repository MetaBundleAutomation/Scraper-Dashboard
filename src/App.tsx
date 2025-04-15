import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Get environment variables from React
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
const POLL_INTERVAL = parseInt(process.env.REACT_APP_POLL_INTERVAL || '1000', 10);

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
    setLogs(prevLogs => [...prevLogs, `> ${message}`]);
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
        
        // Only process new messages
        if (messages.length > lastMessageCount) {
          const newMessages = messages.slice(lastMessageCount);
          
          // Process each new message
          newMessages.forEach(message => {
            if (message.type === 'hello') {
              addLog(`[${message.timestamp}] Container ${message.container_id} says: ${message.message}`);
            } else if (message.type === 'complete') {
              addLog(`[${message.timestamp}] Container ${message.container_id} completed with status: ${message.status}`);
              
              // Format the result nicely
              const resultStr = JSON.stringify(message.result, null, 2);
              addLog(`Result: ${resultStr}`);
            }
          });
          
          // Update the last message count
          setLastMessageCount(messages.length);
        }
      } catch (error) {
        console.error('Error polling for messages:', error);
      }
    }, POLL_INTERVAL);
    
    // Clean up on component unmount
    return () => {
      clearInterval(pollInterval);
    };
  }, [lastMessageCount]);

  // Handle the "Spawn Scraper" button click
  const handleSpawnScraper = async () => {
    try {
      setLoading(true);
      addLog('Requesting new scraper instance...');
      
      const response = await axios.post(`${BACKEND_URL}/spawn`);
      
      // Check if we have a container_id in the response
      if (response.data.container_id) {
        addLog(`Container ID: ${response.data.container_id}`);
      } else if (response.data.message) {
        // Fallback for older API format
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
          <div className="backend-info">
            Connected to: {BACKEND_URL}
          </div>
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
