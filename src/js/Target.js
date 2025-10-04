class Target {
  constructor(entity) {
    /**
     * @type {import("prismarine-entity").Entity}
     */
    this.entity = entity;
    this.isUnreachable = false;
  }

  setUnreachable() {
    this.isUnreachable = true;
  }
}

module.exports = Target;