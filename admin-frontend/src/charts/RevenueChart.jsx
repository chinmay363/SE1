import React, { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

// Date range presets
const DATE_RANGES = {
  TODAY: 'today',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  THIS_MONTH: 'thismonth',
  CUSTOM: 'custom'
}

function RevenueChart({ detailed = false }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [dateRange, setDateRange] = useState(DATE_RANGES.LAST_7_DAYS)
  const [chartType, setChartType] = useState('line') // 'line' or 'bar'
  const [revenueStats, setRevenueStats] = useState(null)

  // Calculate date range
  const getDateRange = (range) => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    switch (range) {
      case DATE_RANGES.TODAY:
        return { start: today, end: new Date() }

      case DATE_RANGES.LAST_7_DAYS:
        const last7Days = new Date(today)
        last7Days.setDate(today.getDate() - 7)
        return { start: last7Days, end: new Date() }

      case DATE_RANGES.LAST_30_DAYS:
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 30)
        return { start: last30Days, end: new Date() }

      case DATE_RANGES.THIS_MONTH:
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        return { start: startOfMonth, end: new Date() }

      default:
        return { start: last7Days, end: new Date() }
    }
  }

  // Fetch revenue data
  const fetchRevenueData = async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await axios.get('/admin/revenue')
      const responseData = res.data.data

      const revenueByDate = responseData.revenueByDate || []

      const chartData = revenueByDate.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        }),
        fullDate: item.date,
        revenue: parseFloat(item.revenue),
        count: parseInt(item.count),
        avgTransaction: (parseFloat(item.revenue) / parseInt(item.count)).toFixed(2)
      }))

      setData(chartData)
      setRevenueStats({
        total: parseFloat(responseData.totalRevenue || 0),
        transactions: responseData.transactionCount || 0,
        average: parseFloat(responseData.averageTransaction || 0),
        min: parseFloat(responseData.minTransaction || 0),
        max: parseFloat(responseData.maxTransaction || 0)
      })
      setLoading(false)
    } catch (err) {
      console.error('Failed to fetch revenue data:', err)
      setError('Failed to load revenue data')
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRevenueData()
  }, [dateRange])

  // Custom tooltip with better formatting
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip" style={{
          backgroundColor: 'white',
          padding: '10px',
          border: '1px solid #ccc',
          borderRadius: '4px'
        }}>
          <p className="label" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{label}</p>
          <p style={{ color: '#2563eb', margin: '2px 0' }}>
            Revenue: ${payload[0].value.toFixed(2)}
          </p>
          {detailed && payload[1] && (
            <p style={{ color: '#10b981', margin: '2px 0' }}>
              Transactions: {payload[1].value}
            </p>
          )}
        </div>
      )
    }
    return null
  }

  // Export data as CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Revenue', 'Transactions', 'Average'],
      ...data.map(row => [row.fullDate, row.revenue, row.count, row.avgTransaction])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `revenue-report-${new Date().toISOString()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="revenue-chart loading">
        <div className="spinner"></div>
        <p>Loading revenue data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="revenue-chart error">
        <p>{error}</p>
        <button onClick={fetchRevenueData}>Retry</button>
      </div>
    )
  }

  const ChartComponent = chartType === 'line' ? LineChart : BarChart
  const DataComponent = chartType === 'line' ? Line : Bar

  return (
    <div className="revenue-chart">
      <div className="chart-header">
        <h3>Revenue Trend</h3>
        <div className="chart-controls">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="date-range-select"
          >
            <option value={DATE_RANGES.TODAY}>Today</option>
            <option value={DATE_RANGES.LAST_7_DAYS}>Last 7 Days</option>
            <option value={DATE_RANGES.LAST_30_DAYS}>Last 30 Days</option>
            <option value={DATE_RANGES.THIS_MONTH}>This Month</option>
          </select>

          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="chart-type-select"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
          </select>

          <button onClick={exportToCSV} className="export-btn">
            Export CSV
          </button>
        </div>
      </div>

      {revenueStats && (
        <div className="revenue-stats-summary">
          <div className="stat-item">
            <span className="stat-label">Total Revenue:</span>
            <span className="stat-value">${revenueStats.total.toFixed(2)}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Transactions:</span>
            <span className="stat-value">{revenueStats.transactions}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Average:</span>
            <span className="stat-value">${revenueStats.average.toFixed(2)}</span>
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={350}>
        <ChartComponent data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <DataComponent
            type={chartType === 'line' ? 'monotone' : undefined}
            dataKey="revenue"
            fill="#2563eb"
            stroke="#2563eb"
            strokeWidth={2}
            name="Revenue ($)"
          />
          {detailed && (
            <DataComponent
              type={chartType === 'line' ? 'monotone' : undefined}
              dataKey="count"
              fill="#10b981"
              stroke="#10b981"
              strokeWidth={2}
              name="Transactions"
            />
          )}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  )
}

export default RevenueChart
