class MobManager {
  static TargetedMobs = new Map();

  static isMobTargeted(entity) {
    for (const [username, mob] of this.TargetedMobs.entries()) {
      if (entity.id === mob.id) {
        return true;
      }
    }

    return false;
  }

  static unTargetMob(entity) {
    for (const [username, mob] of this.TargetedMobs.entries()) {
      if (entity.id === mob.id) {
        this.TargetedMobs.delete(username);
        return;
      }
    }
  }
}

class TargetManager {
  static TargetedPlayers = new Map();
  static isPlayerTargeted(player) {
    if (this.TargetedPlayers.size === 0) return false;

    for (const [username, mob] of this.TargetedPlayers.entries()) {
      if (player.username === mob.username) {
        return true;
      }
    }

    return false;
  }

  static unTargetPlayer(botUsername) {
    if (this.TargetedPlayers.size === 0) return false;

    for (const [username, mob] of this.TargetedPlayers.entries()) {
      if (botUsername === username) {
        this.TargetedPlayers.delete(username);
        return;
      }
    }
  }
}

module.exports = {
  MobManager,
  TargetManager,
};
