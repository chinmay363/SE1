import React, { useState } from 'react';
export default function EntryTerminal(){
  const [plate, setPlate] = useState('');
  async function simulateRecognize(){
    const imageUrl = prompt('Image URL to send to plate recognizer (or cancel)');
    if(!imageUrl) return;
    const res = await fetch('/api/us-005/recognize', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ imageUrl })
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  }

  async function requestEntry(){
    const res = await fetch('/api/us-003/entry', {
      method: 'POST', headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ plate })
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  }

  return (
    <div>
      <h2>Entry Terminal</h2>
      <button onClick={simulateRecognize}>Simulate LPR (via image URL)</button>
      <div>
        <input value={plate} onChange={e=>setPlate(e.target.value)} placeholder="Type plate to simulate entry"/>
        <button onClick={requestEntry}>Request Entry</button>
      </div>
    </div>
  );
}
