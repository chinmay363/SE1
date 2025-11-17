import { useState } from 'react'
import axios from 'axios'
import BarrierAnimation from './BarrierAnimation'
import './ExitFlow.css'

function ExitFlow() {
  const [step, setStep] = useState('input') // input, calculating, payment, processing, barrier
  const [licensePlate, setLicensePlate] = useState('')
  const [sessionData, setSessionData] = useState(null)
  const [paymentId, setPaymentId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLicensePlateInput = (e) => {
    setLicensePlate(e.target.value.toUpperCase())
  }

  const handleCalculateFee = async () => {
    setLoading(true)
    setError('')
    setStep('calculating')

    try {
      // First get active session for this vehicle
      const sessionsRes = await axios.get('/parking/sessions/active')
      const session = sessionsRes.data.data.find(
        s => s.vehicle.licensePlate === licensePlate
      )

      if (!session) {
        throw new Error('No active parking session found for this vehicle')
      }

      // Create payment
      const paymentRes = await axios.post('/payment/create', {
        sessionId: session.id,
        paymentMethod: 'card'
      })

      setSessionData(paymentRes.data.data)
      setPaymentId(paymentRes.data.data.payment.id)
      setStep('payment')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to calculate fee')
      setStep('input')
    } finally {
      setLoading(false)
    }
  }

  const handleProcessPayment = async () => {
    setLoading(true)
    setError('')
    setStep('processing')

    try {
      await axios.post('/payment/confirm', { paymentId })

      // Open exit barrier
      await axios.post('/barrier/exit', { sessionId: sessionData.session.id })

      setStep('barrier')

      // Reset after 5 seconds
      setTimeout(() => {
        resetFlow()
      }, 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Payment processing failed')
      setStep('payment')
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setStep('input')
    setLicensePlate('')
    setSessionData(null)
    setPaymentId(null)
    setError('')
  }

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <div className="exit-flow">
      <h2>🚗 Vehicle Exit</h2>

      {error && <div className="error-message">{error}</div>}

      {step === 'input' && (
        <div className="step-container">
          <h3>Enter License Plate</h3>
          <input
            type="text"
            value={licensePlate}
            onChange={handleLicensePlateInput}
            placeholder="ABC-1234"
            className="license-input"
            maxLength="8"
          />
          <button
            onClick={handleCalculateFee}
            disabled={loading || !licensePlate}
            className="primary-button"
          >
            {loading ? 'Processing...' : 'Calculate Fee'}
          </button>
        </div>
      )}

      {step === 'calculating' && (
        <div className="step-container">
          <div className="loading-spinner"></div>
          <p>Calculating parking fee...</p>
        </div>
      )}

      {step === 'payment' && sessionData && (
        <div className="step-container">
          <h3>💳 Payment Required</h3>
          <div className="payment-summary">
            <div className="summary-item">
              <span className="label">License Plate:</span>
              <span className="value">{sessionData.session.vehicle.licensePlate}</span>
            </div>
            <div className="summary-item">
              <span className="label">Parking Duration:</span>
              <span className="value">{formatDuration(sessionData.durationMinutes)}</span>
            </div>
            <div className="summary-item">
              <span className="label">Space Number:</span>
              <span className="value">{sessionData.session.space.spaceNumber}</span>
            </div>
            <div className="summary-item total">
              <span className="label">Total Amount:</span>
              <span className="value">${sessionData.amount.toFixed(2)}</span>
            </div>
          </div>
          <button
            onClick={handleProcessPayment}
            disabled={loading}
            className="primary-button large"
          >
            {loading ? 'Processing Payment...' : 'Process Payment'}
          </button>
        </div>
      )}

      {step === 'processing' && (
        <div className="step-container">
          <div className="loading-spinner"></div>
          <p>Processing payment...</p>
        </div>
      )}

      {step === 'barrier' && (
        <div className="step-container success">
          <h3>✅ Payment Successful</h3>
          <BarrierAnimation />
          <p className="success-message">Thank you! Please exit the parking facility</p>
        </div>
      )}
    </div>
  )
}

export default ExitFlow
