import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import Card from '../components/Card';

function Hello() {
  interface HighlightItem {
    title: string;
    url: string;
    text: string;
  }

  const [savedItems, setSavedItems] = useState(
    JSON.parse(localStorage.getItem('highlights') as string) || []
  );

  const [url, setUrl] = useState('');
  const handleClick = () => {
    window.electron.ipcRenderer.sendMessage('open-url', url);
  };

  const addItem = (item: string) => {
    const highlights = [...savedItems, JSON.parse(item)];
    localStorage.setItem('highlights', JSON.stringify(highlights));
    setSavedItems(highlights);
  };

  window.electron.ipcRenderer.on('ipc-example', (item) => {
    addItem(item);
  });

  return (
    <div>
      <div>
        <h1>Your highlights:</h1>
        {savedItems.length ? (
          // eslint-disable-next-line react/no-array-index-key
          savedItems.map((item: HighlightItem, index) => <Card key={index} item={item} />)
        ) : (
          <p>No highlights yet!</p>
        )}
      </div>
      <div>
        <input
          value={url}
          type="text"
          onChange={(e) => setUrl(e.target.value)}
        />
        <button onClick={handleClick}>Go</button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Hello />} />
      </Routes>
    </Router>
  );
}
