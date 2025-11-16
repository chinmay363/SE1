import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
const socket = io(process.env.REACT_APP_BACKEND || 'http://localhost:4000');

export default function AdminDashboard(){
  const [status, setStatus] = useState({ total:0, occupied:0, free:0});
  useEffect(()=>{
    socket.on('occupancy_update', s => setStatus(s));
    fetch('/api/us-002/status').then(r=>r.json()).then(setStatus);
  },[]);
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Total: {status.total}</p>
      <p>Occupied: {status.occupied}</p>
      <p>Free: {status.free ?? (status.total - status.occupied)}</p>
    </div>
  );
}
