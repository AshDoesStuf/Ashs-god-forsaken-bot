const socket = io();

socket.on("update", (data) => {
  document.getElementById("health").innerHTML = Math.floor(data.health);
  document.getElementById("food").innerHTML = data.food;
  document.getElementById("pos").innerHTML = `X:${Math.floor(
    data.position.x
  )}, Y:${Math.floor(data.position.y)}, Z:${Math.floor(data.position.z)}`;
});

socket.on("settings-update", (settings) => {
  document.getElementById("aggressive").innerHTML = settings.agg;
  document.getElementById("FFA").innerHTML = settings.ffa;
  document.getElementById("persistant").innerHTML = settings.per;
  document.getElementById("hacker").innerHTML = settings.hack;
  document.getElementById("display").innerHTML = settings.display;
});

socket.on("main-update", (data) => {
  document.getElementById("eating").innerHTML = data.eating;
  document.getElementById("sprinting").innerHTML = data.sprinting;
  document.getElementById("close").innerHTML = data.close;
  document.getElementById("time-to-reach").innerHTML = data.timeToReach;
  document.getElementById("reach").innerHTML = data.reach;
  document.getElementById("shooting").innerHTML = data.shooting;
  document.getElementById("combat").innerHTML = data.combat;
  document.getElementById("pve").innerHTML = data.pve;
  document.getElementById("debounce").innerHTML = data.debounce;
  document.getElementById("current-cooldown").innerHTML = data.currentCooldown;
  document.getElementById("pearling").innerHTML = data.pearling;
  document.getElementById("hungry").innerHTML = data.hungry;
  document.getElementById("pathing").innerHTML = data.pathing;
  document.getElementById("has-health-pots").innerHTML = data.hasHealthPotions;
  document.getElementById("looking-at").innerHTML = data.lookingAt;
  document.getElementById("placing").innerHTML = data.placing;
  document.getElementById("blocking").innerHTML = data.blocking;
  document.getElementById("hits").innerHTML = data.hits;
  document.getElementById(
    "last-fight-time"
  ).innerHTML = `${data.lastFightTime.seconds}s || ${data.lastFightTime.minutes}m`;
  document.getElementById("time-since-start").innerHTML = data.timeSinceStart;
  document.getElementById("active-effects").innerHTML = data.activeEffects;
  document.getElementById("held-item-durability").innerHTML =
    data.heldItemDurability;
  document.getElementById("offenders").innerHTML = data.offenders;
  document.getElementById("current-target").innerHTML = data.currentTarget;
  document.getElementById("offhand-prio").innerHTML = data.offhandPrio;
  document.getElementById("moving").innerHTML = data.moving;
  document.getElementById("uppercutting").innerHTML = data.uppercutting;
  document.getElementById("exploring").innerHTML = data.exploring;
});
