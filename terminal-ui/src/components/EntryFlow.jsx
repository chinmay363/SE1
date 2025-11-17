import { useState } from 'react'
import axios from 'axios'
import BarrierAnimation from './BarrierAnimation'
import './EntryFlow.css'

function EntryFlow() {
  const [step, setStep] = useState('upload') // upload, processing, detected, allocated, barrier
  const [imageData, setImageData] = useState('')
  const [licensePlate, setLicensePlate] = useState('')
  const [allocatedSpace, setAllocatedSpace] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImageData(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSimulateImage = () => {
    const simulated = `simulated-image-${Date.now()}`
    setImageData(simulated)
  }

  const handleIdentify = async () => {
    setLoading(true)
    setError('')
    setStep('processing')

    try {
      const response = await axios.post('/identify', {
        image: imageData,
        simulateFailure: false
      })

      setLicensePlate(response.data.data.licensePlate)
      setStep('detected')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to identify license plate')
      setStep('upload')
    } finally {
      setLoading(false)
    }
  }

  const handleAllocate = async () => {
    setLoading(true)
    setError('')

    try {
      const response = await axios.post('/parking/allocate', {
        licensePlate
      })

      setAllocatedSpace(response.data.data.space)
      setSessionId(response.data.data.session.id)
      setStep('allocated')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to allocate parking space')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenBarrier = async () => {
    setLoading(true)
    setError('')

    try {
      await axios.post('/barrier/entry', { sessionId })
      setStep('barrier')

      // Reset after 5 seconds
      setTimeout(() => {
        resetFlow()
      }, 5000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to open barrier')
    } finally {
      setLoading(false)
    }
  }

  const resetFlow = () => {
    setStep('upload')
    setImageData('')
    setLicensePlate('')
    setAllocatedSpace(null)
    setSessionId(null)
    setError('')
  }

  return (
    <div className="entry-flow">
      <h2>🚗 Vehicle Entry</h2>

      {error && <div className="error-message">{error}</div>}

      {step === 'upload' && (
        <div className="step-container">
          <h3>Upload or Simulate License Plate Image</h3>
          <div className="upload-section">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              id="image-upload"
            />
            <label htmlFor="image-upload" className="upload-button">
              Choose Image
            </label>
            <button onClick={handleSimulateImage} className="simulate-button">
              Simulate Image
            </button>
          </div>
          {imageData && (
            <div className="image-preview">
              <p>Image ready ✓</p>
              <button
                onClick={handleIdentify}
                disabled={loading}
                className="primary-button"
              >
                {loading ? 'Processing...' : 'Identify License Plate'}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 'processing' && (
        <div className="step-container">
          <div className="loading-spinner"></div>
          <p>Scanning license plate...</p>
        </div>
      )}

      {step === 'detected' && (
        <div className="step-container success">
          <h3>✅ License Plate Detected</h3>
          <div className="license-plate-display">
            {licensePlate}
          </div>
          <button
            onClick={handleAllocate}
            disabled={loading}
            className="primary-button"
          >
            {loading ? 'Allocating...' : 'Allocate Parking Space'}
          </button>
        </div>
      )}

      {step === 'allocated' && allocatedSpace && (
        <div className="step-container success">
          <h3>🅿️ Parking Space Allocated</h3>
          <div className="space-info">
            <div className="info-item">
              <span className="label">Space Number:</span>
              <span className="value">{allocatedSpace.spaceNumber}</span>
            </div>
            <div className="info-item">
              <span className="label">Floor:</span>
              <span className="value">{allocatedSpace.floor}</span>
            </div>
            <div className="info-item">
              <span className="label">Zone:</span>
              <span className="value">{allocatedSpace.zone}</span>
            </div>
          </div>
          <button
            onClick={handleOpenBarrier}
            disabled={loading}
            className="primary-button large"
          >
            {loading ? 'Opening...' : 'Open Entry Barrier'}
          </button>
        </div>
      )}

      {step === 'barrier' && (
        <div className="step-container success">
          <h3>🚧 Barrier Opening</h3>
          <BarrierAnimation />
          <p className="success-message">Please proceed to your parking space</p>
        </div>
      )}
    </div>
  )
}

export default EntryFlow
