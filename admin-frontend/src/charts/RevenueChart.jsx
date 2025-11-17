import { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function RevenueChart({ detailed = false }) {
  const [data, setData] = useState([])

  useEffect(() => {
    fetchRevenueData()
  }, [])

  const fetchRevenueData = async () => {
    try {
      const res = await axios.get('/admin/revenue')
      const revenueByDate = res.data.data.revenueByDate || []

      const chartData = revenueByDate.map(item => ({
        date: new Date(item.date).toLocaleDateString(),
        revenue: parseFloat(item.revenue),
        count: parseInt(item.count)
      }))

      setData(chartData)
    } catch (err) {
      console.error('Failed to fetch revenue data:', err)
    }
  }

  return (
    <div className="revenue-chart">
      <h3>Revenue Trend</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={2} />
          {detailed && <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} />}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export default RevenueChart
