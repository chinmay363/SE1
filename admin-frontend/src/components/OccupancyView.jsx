import React, { useState, useEffect, useMemo, useCallback } from 'react'
import axios from 'axios'
import './OccupancyView.css'

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('OccupancyView Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <h3>Something went wrong</h3>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button onClick={() => window.location.reload()}>Reload Page</button>
        </div>
      )
    }
    return this.props.children
  }
}

function OccupancyView() {
  const [occupancy, setOccupancy] = useState(null)
  const [spaces, setSpaces] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)

  // Memoized calculations for performance
  const occupancyStats = useMemo(() => {
    if (!occupancy) return null

    return {
      available: occupancy.available || 0,
      occupied: occupancy.occupied || 0,
      maintenance: occupancy.maintenance || 0,
      total: occupancy.total || 0,
      rate: occupancy.occupancyRate || '0.00',
      cached: occupancy.cached || false
    }
  }, [occupancy])

  // Memoized space groups by floor/zone for better visualization
  const groupedSpaces = useMemo(() => {
    if (!spaces.length) return {}

    return spaces.reduce((acc, space) => {
      const key = `${space.floor}-${space.zone}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(space)
      return acc
    }, {})
  }, [spaces])

  // Fetch data with error handling
  const fetchData = useCallback(async () => {
    try {
      setError(null)

      const [occRes, spacesRes] = await Promise.all([
        axios.get('/admin/occupancy'),
        axios.get('/parking/spaces')
      ])

      setOccupancy(occRes.data.data)
      setSpaces(spacesRes.data.data)
      setLastUpdate(new Date())
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch occupancy data:', err)
      setError(err.response?.data?.message || 'Failed to load occupancy data')
      setLoading(false)
    }
  }, [])

  // Setup auto-refresh
  useEffect(() => {
    fetchData()

    let interval = null
    if (autoRefresh) {
      interval = setInterval(fetchData, 5000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchData, autoRefresh])

  // Loading state
  if (loading) {
    return (
      <div className="occupancy-view loading">
        <div className="spinner"></div>
        <p>Loading occupancy data...</p>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="occupancy-view error">
        <h3>Error Loading Data</h3>
        <p>{error}</p>
        <button onClick={fetchData} className="retry-btn">Retry</button>
      </div>
    )
  }

  // No data state
  if (!occupancyStats) {
    return (
      <div className="occupancy-view">
        <p>No occupancy data available</p>
      </div>
    )
  }

  return (
    <div className="occupancy-view">
      <div className="header">
        <h2>Real-Time Occupancy</h2>
        <div className="controls">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`toggle-btn ${autoRefresh ? 'active' : ''}`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <button onClick={fetchData} className="refresh-btn">
            Refresh Now
          </button>
          {lastUpdate && (
            <span className="last-update">
              Last update: {lastUpdate.toLocaleTimeString()}
              {occupancyStats.cached && ' (cached)'}
            </span>
          )}
        </div>
      </div>

      <div className="occupancy-stats">
        <div className="stat available">
          <h3>Available</h3>
          <p className="stat-value">{occupancyStats.available}</p>
          <span className="stat-percentage">
            {((occupancyStats.available / occupancyStats.total) * 100).toFixed(1)}%
          </span>
        </div>
        <div className="stat occupied">
          <h3>Occupied</h3>
          <p className="stat-value">{occupancyStats.occupied}</p>
          <span className="stat-percentage">{occupancyStats.rate}%</span>
        </div>
        <div className="stat maintenance">
          <h3>Maintenance</h3>
          <p className="stat-value">{occupancyStats.maintenance}</p>
        </div>
        <div className="stat total">
          <h3>Total Spaces</h3>
          <p className="stat-value">{occupancyStats.total}</p>
        </div>
      </div>

      <div className="spaces-container">
        <h3>Space Status ({Math.min(spaces.length, 100)} spaces shown)</h3>
        <div className="spaces-grid">
          {spaces.slice(0, 100).map(space => (
            <div
              key={space.id}
              className={`space-item ${space.status}`}
              title={`${space.spaceNumber} - ${space.status}`}
            >
              <span className="space-number">{space.spaceNumber}</span>
              <span className="space-status">{space.status[0].toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Export wrapped with Error Boundary
export default function OccupancyViewWithErrorBoundary() {
  return (
    <ErrorBoundary>
      <OccupancyView />
    </ErrorBoundary>
  )
}
