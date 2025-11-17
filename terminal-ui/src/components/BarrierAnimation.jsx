import { useState, useEffect } from 'react'
import './BarrierAnimation.css'

function BarrierAnimation() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // Start opening animation
    setTimeout(() => setIsOpen(true), 100)
  }, [])

  return (
    <div className="barrier-container">
      <div className={`barrier ${isOpen ? 'open' : 'closed'}`}>
        <div className="barrier-arm"></div>
        <div className="barrier-base"></div>
      </div>
      <p className="barrier-status">
        {isOpen ? '🟢 Barrier Open' : '🔴 Barrier Closed'}
      </p>
    </div>
  )
}

export default BarrierAnimation
