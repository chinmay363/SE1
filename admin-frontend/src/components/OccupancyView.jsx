import { useState, useEffect } from 'react'
import axios from 'axios'
import './OccupancyView.css'

function OccupancyView() {
  const [occupancy, setOccupancy] = useState(null)
  const [spaces, setSpaces] = useState([])

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 5000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [occRes, spacesRes] = await Promise.all([
        axios.get('/admin/occupancy'),
        axios.get('/parking/spaces')
      ])
      setOccupancy(occRes.data.data)
      setSpaces(spacesRes.data.data)
    } catch (err) {
      console.error('Failed to fetch occupancy data:', err)
    }
  }

  if (!occupancy) return <div>Loading...</div>

  return (
    <div className="occupancy-view">
      <h2>Real-Time Occupancy</h2>

      <div className="occupancy-stats">
        <div className="stat available">
          <h3>Available</h3>
          <p>{occupancy.available}</p>
        </div>
        <div className="stat occupied">
          <h3>Occupied</h3>
          <p>{occupancy.occupied}</p>
        </div>
        <div className="stat maintenance">
          <h3>Maintenance</h3>
          <p>{occupancy.maintenance}</p>
        </div>
        <div className="stat total">
          <h3>Total</h3>
          <p>{occupancy.total}</p>
        </div>
      </div>

      <div className="spaces-grid">
        {spaces.slice(0, 50).map(space => (
          <div key={space.id} className={`space-item ${space.status}`}>
            <span className="space-number">{space.spaceNumber}</span>
            <span className="space-status">{space.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default OccupancyView
