// Canvas drawing for Star Dodger. All shapes are drawn with code.
import { makeRng } from "../../utils/rng";
import { W, H, SHIP_R } from "./engine";

export function makeStarfield() {
  const rng = makeRng(4242);
  return Array.from({ length: 70 }, () => ({
    x: rng.random() * W,
    y: rng.random() * H,
    r: rng.between(0.5, 1.8),
    speed: rng.between(10, 60),
  }));
}

export function createFx() {
  return { time: 0, bursts: [], flash: 0 };
}

export function stepFx(fx, g, dt, reduced) {
  fx.time += dt;
  g.events.splice(0).forEach((ev) => {
    if (ev.type === "crash" || ev.type === "shield-break") {
      const n = reduced ? 0 : ev.type === "crash" ? 22 : 10;
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 140;
        fx.bursts.push({ x: ev.x, y: ev.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, c: ev.type === "crash" ? "#ffb067" : "#7cf5ff" });
      }
      if (!reduced) fx.flash = ev.type === "crash" ? 0.35 : 0.15;
    } else if (ev.type === "star" && !reduced) {
      for (let i = 0; i < 6; i++) {
        const a = Math.random() * Math.PI * 2;
        fx.bursts.push({ x: ev.x, y: ev.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, age: 0, c: "#ffe27a" });
      }
    }
  });
  fx.flash = Math.max(0, fx.flash - dt);
  fx.bursts.forEach((b) => {
    b.age += dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  });
  fx.bursts = fx.bursts.filter((b) => b.age < 0.6);
}

function drawStar(ctx, x, y, r, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.45 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShip(ctx, ship, skin, time, shield) {
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.shadowColor = skin.color;
  ctx.shadowBlur = 14;
  ctx.fillStyle = skin.color;
  if (skin.id === "saucer") {
    ctx.beginPath();
    ctx.ellipse(0, 2, 15, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(220,255,245,0.9)";
    ctx.beginPath();
    ctx.ellipse(0, -2, 7, 6, 0, Math.PI, 0);
    ctx.fill();
  } else if (skin.id === "comet") {
    ctx.beginPath();
    ctx.arc(0, 0, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    const tail = ctx.createLinearGradient(0, 0, 0, 30);
    tail.addColorStop(0, "rgba(76,201,255,0.7)");
    tail.addColorStop(1, "rgba(76,201,255,0)");
    ctx.fillStyle = tail;
    ctx.beginPath();
    ctx.moveTo(-8, 0);
    ctx.lineTo(8, 0);
    ctx.lineTo(0, 30);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.moveTo(0, -SHIP_R - 3);
    ctx.lineTo(8, 9);
    ctx.lineTo(0, 5);
    ctx.lineTo(-8, 9);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = `rgba(255,200,90,${0.7 + 0.3 * Math.sin(time * 30)})`;
    ctx.beginPath();
    ctx.moveTo(-3, 8);
    ctx.lineTo(3, 8);
    ctx.lineTo(0, 16 + Math.sin(time * 40) * 3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  if (shield > 0) {
    ctx.save();
    ctx.globalAlpha = shield < 2 && Math.floor(time * 8) % 2 ? 0.25 : 0.8;
    ctx.strokeStyle = "#7cf5ff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ship.x, ship.y, SHIP_R + 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

const POWER_LOOK = {
  shield: { color: "#7cf5ff", glyph: "S" },
  magnet: { color: "#ff7ad9", glyph: "M" },
  slow: { color: "#b69cff", glyph: "Z" },
};

export function draw(ctx, g, world, skin, fx, stars) {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, world.sky[0]);
  sky.addColorStop(1, world.sky[1]);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // scrolling stars (slower when slow-mo is on)
  const k = g.slow > 0 ? 0.5 : 1;
  ctx.fillStyle = "#fff";
  stars.forEach((s) => {
    const y = (s.y + fx.time * s.speed * k) % H;
    ctx.globalAlpha = 0.35 + s.r / 3;
    ctx.fillRect(s.x, y, s.r, s.r * (1 + s.speed / 40));
  });
  ctx.globalAlpha = 1;

  if (g.hole) {
    const { x, y, r } = g.hole;
    const glow = ctx.createRadialGradient(x, y, r * 0.6, x, y, r * 4);
    glow.addColorStop(0, "rgba(255,138,61,0.55)");
    glow.addColorStop(1, "rgba(255,61,110,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - r * 4, y - r * 4, r * 8, r * 8);
    ctx.strokeStyle = "rgba(255,170,90,0.7)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x, y, r * 1.9, r * 0.6, fx.time * 0.8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  g.pickups.forEach((p) => {
    if (p.kind === "star") {
      ctx.shadowColor = "#ffe27a";
      ctx.shadowBlur = 10;
      drawStar(ctx, p.x, p.y, 10, "#ffe27a");
      ctx.shadowBlur = 0;
    } else {
      const look = POWER_LOOK[p.kind];
      ctx.strokeStyle = look.color;
      ctx.fillStyle = "rgba(10,14,30,0.8)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = look.color;
      ctx.font = "800 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(look.glyph, p.x, p.y + 1);
    }
  });

  g.asteroids.forEach((a) => {
    ctx.save();
    ctx.translate(a.x, a.y);
    ctx.rotate(a.rot);
    ctx.fillStyle = world.rock;
    ctx.beginPath();
    for (let i = 0; i < 9; i++) {
      const ang = (i / 9) * Math.PI * 2;
      const rr = a.r * (0.82 + 0.18 * Math.sin(i * 2.3 + a.r));
      ctx.lineTo(Math.cos(ang) * rr, Math.sin(ang) * rr);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.arc(-a.r * 0.25, -a.r * 0.15, a.r * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });

  if (!g.over) drawShip(ctx, g.ship, skin, fx.time, g.shield);

  fx.bursts.forEach((b) => {
    ctx.globalAlpha = 1 - b.age / 0.6;
    ctx.fillStyle = b.c;
    ctx.fillRect(b.x - 2, b.y - 2, 4, 4);
  });
  ctx.globalAlpha = 1;
  if (fx.flash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${fx.flash})`;
    ctx.fillRect(0, 0, W, H);
  }
}
