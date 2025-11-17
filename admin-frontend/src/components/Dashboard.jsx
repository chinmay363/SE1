import { useState, useEffect } from 'react'
import axios from 'axios'
import OccupancyView from './OccupancyView'
import RevenueChart from '../charts/RevenueChart'
import LogsView from './LogsView'
import './Dashboard.css'

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 10000) // Refresh every 10s
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await axios.get('/admin/dashboard')
      setDashboardData(res.data.data)
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="loading">Loading dashboard...</div>
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>🅿️ APMS Admin Dashboard</h1>
        <div className="user-info">
          <span>👤 {user?.username} ({user?.role})</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </header>

      <nav className="dashboard-nav">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'occupancy' ? 'active' : ''}
          onClick={() => setActiveTab('occupancy')}
        >
          Occupancy
        </button>
        <button
          className={activeTab === 'revenue' ? 'active' : ''}
          onClick={() => setActiveTab('revenue')}
        >
          Revenue
        </button>
        <button
          className={activeTab === 'logs' ? 'active' : ''}
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </nav>

      <main className="dashboard-main">
        {activeTab === 'overview' && dashboardData && (
          <div className="overview">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Occupancy Rate</h3>
                <p className="stat-value">{dashboardData.occupancy.occupancyRate}%</p>
                <p className="stat-label">{dashboardData.occupancy.occupied} / {dashboardData.occupancy.total}</p>
              </div>
              <div className="stat-card">
                <h3>Today's Revenue</h3>
                <p className="stat-value">${dashboardData.revenue.today}</p>
                <p className="stat-label">{dashboardData.revenue.transactions} transactions</p>
              </div>
              <div className="stat-card">
                <h3>Active Sessions</h3>
                <p className="stat-value">{dashboardData.activeSessions}</p>
                <p className="stat-label">Currently parked</p>
              </div>
              <div className="stat-card alert">
                <h3>Unresolved Alerts</h3>
                <p className="stat-value">{dashboardData.unresolvedAlerts}</p>
                <p className="stat-label">Requires attention</p>
              </div>
            </div>

            <div className="charts-section">
              <RevenueChart />
            </div>
          </div>
        )}

        {activeTab === 'occupancy' && <OccupancyView />}

        {activeTab === 'revenue' && (
          <div className="revenue-view">
            <h2>Revenue Analytics</h2>
            <RevenueChart detailed={true} />
          </div>
        )}

        {activeTab === 'logs' && <LogsView />}
      </main>
    </div>
  )
}

export default Dashboard
