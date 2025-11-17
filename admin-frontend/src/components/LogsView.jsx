import { useState, useEffect } from 'react'
import axios from 'axios'
import './LogsView.css'

function LogsView() {
  const [logs, setLogs] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchLogs()
  }, [filter])

  const fetchLogs = async () => {
    try {
      const params = filter !== 'all' ? { level: filter } : {}
      const res = await axios.get('/admin/logs', { params })
      setLogs(res.data.data.logs)
    } catch (err) {
      console.error('Failed to fetch logs:', err)
    }
  }

  return (
    <div className="logs-view">
      <div className="logs-header">
        <h2>System Logs</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Levels</option>
          <option value="info">Info</option>
          <option value="warn">Warning</option>
          <option value="error">Error</option>
        </select>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Level</th>
              <th>Action</th>
              <th>Message</th>
              <th>User</th>
            </tr>
          </thead>
          <tbody>
            {logs.map(log => (
              <tr key={log.id} className={`log-${log.level}`}>
                <td>{new Date(log.timestamp).toLocaleString()}</td>
                <td><span className={`badge ${log.level}`}>{log.level}</span></td>
                <td>{log.action}</td>
                <td>{log.message}</td>
                <td>{log.user?.username || 'System'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LogsView
