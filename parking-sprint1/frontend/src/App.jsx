import React, { useEffect, useState, useMemo } from 'react';
import io from 'socket.io-client';

const BACKEND = process.env.REACT_APP_BACKEND || 'http://localhost:4000';
const socket = io(BACKEND, { autoConnect: false, transports: ['websocket','polling'] });

async function api(path, opts = {}) {
  const res = await fetch(${BACKEND}${path}, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

function StatCard({ title, value, delta }) {
  return (
    <div className="bg-white rounded-xl p-4 shadow flex flex-col">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="mt-2 text-3xl font-bold text-slate-800">{value}</div>
      {delta !== undefined && <div className="text-xs text-gray-400 mt-1">Δ {delta}</div>}
    </div>
  );
}

function SlotBox({ id, occupied }) {
  return (
    <div className={`rounded-md flex items-center justify-center text-xs font-semibold 
      ${occupied ? 'bg-rose-600 text-white' : 'bg-emerald-200 text-slate-900' } p-2`}>
      {S${id}}
    </div>
  );
}

function SlotGrid({ total = 50, occupied = 0 }) {
  const cols = 8;
  const cells = Array.from({ length: total }, (_, i) => ({ id: i + 1, occupied: i < occupied }));
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: repeat(${cols}, minmax(0,1fr)) }}>
      {cells.map(c => <SlotBox key={c.id} id={c.id} occupied={c.occupied} />)}
    </div>
  );
}

export default function App() {
  const [status, setStatus] = useState({ total: 0, occupied: 0, free: 0 });
  const [logs, setLogs] = useState([]);
  const [plate, setPlate] = useState('');
  const [imgUrl, setImgUrl] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const s = await api('/api/us-002/status');
        setStatus(s);
        const l = await fetch('/api/us-008/logs?limit=30').then(r => r.ok ? r.json() : { logs: [] });
        if (l && l.logs) setLogs(l.logs);
      } catch (err) {
        console.warn('Initial fetch failed', err);
      }
    })();

    socket.connect();
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('occupancy_update', s => setStatus(prev => ({ ...prev, ...s })));
    socket.on('new_event', e => setLogs(prev => [e, ...prev].slice(0, 200)));

    return () => {
      socket.off('occupancy_update');
      socket.off('new_event');
      socket.disconnect();
    };
  }, []);

  const percent = useMemo(() => (status.total ? Math.round((status.occupied / status.total) * 100) : 0), [status]);

  async function allocate() {
    if (!plate) return alert('Enter plate');
    setLoading(true);
    try {
      const r = await api('/api/us-001/allocate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate })
      });
      alert(Allocated: ${r.slotId});
      const s = await api('/api/us-002/status'); setStatus(s);
    } catch (err) {
      alert('Allocate error: ' + err.message);
    } finally { setLoading(false); }
  }

  async function requestEntry() {
    if (!plate) return alert('Enter plate');
    try {
      const r = await api('/api/us-003/entry', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plate })
      });
      alert(JSON.stringify(r));
      const s = await api('/api/us-002/status'); setStatus(s);
    } catch (err) {
      alert('Entry error: ' + err.message);
    }
  }

  async function recognize() {
    if (!imgUrl) return alert('Provide image URL');
    try {
      const r = await api('/api/us-005/recognize', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ imageUrl: imgUrl })
      });
      if (r.plate) { setPlate(r.plate); alert('Plate: ' + r.plate); }
    } catch (err) {
      alert('LPR error: ' + err.message);
    }
  }

  async function refreshLogs() {
    try {
      const l = await fetch('/api/us-008/logs?limit=50').then(r => r.ok ? r.json() : { logs: [] });
      if (l && l.logs) setLogs(l.logs);
    } catch (e) { console.warn(e); }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <div className="max-w-7xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-800">Parking Management</h1>
            <p className="text-sm text-slate-500 mt-1">Demo dashboard · Sprint 1</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-600">
              Backend: <span className="font-medium text-slate-800">{BACKEND}</span>
            </div>
            <div className={px-3 py-1 rounded-full text-xs font-medium ${connected ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}}>
              {connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        </header>

        <main className="grid grid-cols-12 gap-6">
          <section className="col-span-8 space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <StatCard title="Total slots" value={status.total ?? '—'} />
              <StatCard title="Occupied" value={status.occupied ?? '—'} />
              <StatCard title="Free" value={status.free ?? '—'} />
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Parking Layout</h2>
                <div className="text-sm text-slate-500">{percent}% occupied</div>
              </div>
              <SlotGrid total={status.total || 50} occupied={status.occupied || 0} />
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">System Events</h2>
                <div className="flex items-center gap-2">
                  <button onClick={refreshLogs} className="text-indigo-600 text-sm">Refresh</button>
                </div>
              </div>

              <div className="max-h-64 overflow-auto scrollbar-thin space-y-3">
                {logs.length === 0 && <div className="text-sm text-slate-400">No events yet.</div>}
                {logs.map((l, idx) => (
                  <div key={l.id || idx} className="p-3 border rounded-md bg-slate-50">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium text-slate-700">{l.type}</div>
                      <div className="text-xs text-slate-400">{new Date(l.createdAt).toLocaleString()}</div>
                    </div>
                    <div className="text-sm text-slate-600 mt-1">{l.message}</div>
                    {l.payload && <pre className="text-xs text-slate-400 mt-2">{JSON.stringify(l.payload)}</pre>}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <aside className="col-span-4 space-y-6">
            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold mb-3">Entry Terminal</h3>

              <label className="block text-sm text-slate-600 mb-1">License plate</label>
              <input value={plate} onChange={e => setPlate(e.target.value)} placeholder="KA01AB1234" className="w-full border rounded px-3 py-2 mb-3" />

              <div className="flex gap-2 mb-3">
                <button onClick={allocate} disabled={loading} className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  {loading ? 'Allocating...' : 'Allocate'}
                </button>
                <button onClick={requestEntry} className="flex-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700">Entry</button>
              </div>

              <div className="mb-3">
                <label className="block text-sm text-slate-600 mb-1">LPR (image URL)</label>
                <input value={imgUrl} onChange={e => setImgUrl(e.target.value)} placeholder="https://..." className="w-full border rounded px-3 py-2" />
                <div className="mt-2 flex gap-2">
                  <button onClick={recognize} className="px-3 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600">Recognize</button>
                  <button onClick={() => setImgUrl('')} className="px-3 py-2 border rounded">Clear</button>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-5">
              <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
              <div className="grid gap-2">
                <button onClick={async () => { try { const r = await api('/api/us-004/check'); alert(JSON.stringify(r)); } catch (e) { alert('Error: ' + e.message); } }} className="w-full px-3 py-2 bg-amber-500 text-white rounded">Check Lot</button>
                <button onClick={async () => { await fetch('/api/us-008/log', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({ type:'UI', message: 'Manual ping'}) }); alert('Logged'); }} className="w-full px-3 py-2 bg-slate-700 text-white rounded">Log Event</button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-primary-50 to-slate-50 rounded-xl p-5 shadow">
              <div className="text-sm text-slate-600">Status</div>
              <div className="mt-2 text-lg font-semibold">Realtime</div>
              <div className="mt-3 text-sm text-slate-500">Socket connection: {connected ? <span className="text-green-600">OK</span> : <span className="text-red-600">Disconnected</span>}</div>
            </div>
          </aside>
        </main>

        <footer className="mt-8 text-sm text-slate-500">© {new Date().getFullYear()} Parking Demo · Sprint 1</footer>
      </div>
    </div>
  );
}