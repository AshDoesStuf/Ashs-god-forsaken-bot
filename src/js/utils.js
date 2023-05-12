class Timer {
  constructor() {
    this.lastMs = Date.now();
  }

  reset() {
    this.lastMs = Date.now();
  }

  hasTimeElapsed(time, reset) {
    if (Date.now() - this.lastMs > time) {
      if (reset) this.reset();

      return true;
    }

    return false;
  }
}

module.exports = {
  Timer
}
