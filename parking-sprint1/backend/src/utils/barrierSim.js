class BarrierSim {
  constructor() {
    this.state = 'CLOSED';
  }
  open() {
    this.state = 'OPEN';
    setTimeout(() => this.state = 'CLOSED', 5000);
    return this.state;
  }
  close() {
    this.state = 'CLOSED';
    return this.state;
  }
  getState() { return this.state; }
}

module.exports = new BarrierSim();
