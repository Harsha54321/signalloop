// Canvas drawing for Neon Stack: sky, world scenery, the tower and effects.
// Everything is drawn with code (no image files) so it works offline.
import { makeRng } from "../../utils/rng";
import { W, H, BLOCK_H, GROUND_Y } from "./engine";
import { blockColor } from "./worlds";

const SPAN = H + 160; // scenery wraps around this height so it never runs out

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const mix = (a, b, t) => {
  const A = hexToRgb(a);
  const B = hexToRgb(b);
  return `rgb(${A.map((v, i) => Math.round(v + (B[i] - v) * t)).join(",")})`;
};
const wrapY = (y) => ((y % SPAN) + SPAN) % SPAN - 80;

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

// ---------- scenery (positions are made once per run, from a fixed seed) ----------
export function makeDecor(world) {
  const rng = makeRng(world.id.length * 7919 + world.id.charCodeAt(0));
  const spread = (n, make) => Array.from({ length: n }, () => make());
  const stars = spread(60, () => ({
    x: rng.random() * W,
    y0: rng.random() * SPAN,
    r: rng.between(0.5, 1.5),
    par: rng.between(0.05, 0.25),
    tw: rng.random() * 6,
  }));
  const decor = { stars };

  if (world.kind === "city") {
    decor.layers = [0.12, 0.28].map((par, layer) => {
      const items = [];
      let x = -10;
      while (x < W + 10) {
        const w = rng.between(26, 52);
        const h = rng.between(60, 150) + layer * 40;
        const windows = [];
        for (let wy = 10; wy < h - 8; wy += 14) {
          for (let wx = 6; wx < w - 8; wx += 11) {
            if (rng.random() < 0.35) windows.push([wx, wy]);
          }
        }
        items.push({ x, w, h, windows });
        x += w + rng.between(2, 10);
      }
      return { par, items };
    });
  } else if (world.kind === "sunset") {
    decor.hills = [
      { par: 0.1, amp: 26, freq: 0.021, phase: 1, fill: "#5a2a78" },
      { par: 0.22, amp: 34, freq: 0.014, phase: 3, fill: "#3b1a5c" },
    ];
    decor.clouds = spread(6, () => ({
      x: rng.random() * W,
      y0: rng.random() * SPAN,
      w: rng.between(46, 90),
      par: rng.between(0.12, 0.3),
      drift: rng.between(3, 9),
    }));
  } else if (world.kind === "ocean") {
    decor.bubbles = spread(26, () => ({
      x: rng.random() * W,
      y0: rng.random() * SPAN,
      r: rng.between(1.5, 5),
      speed: rng.between(14, 40),
      wob: rng.random() * 6,
      par: rng.between(0.1, 0.3),
    }));
    decor.rays = spread(5, () => ({ x: rng.random() * W, w: rng.between(26, 60), a: rng.between(0.04, 0.1) }));
  } else if (world.kind === "space") {
    decor.planets = [
      { x: 70, y0: 140, r: 34, par: 0.12, color: "#5b6dff", ring: true },
      { x: 258, y0: 330, r: 18, par: 0.2, color: "#ff8fb1", ring: false },
    ];
    decor.nebula = spread(4, () => ({
      x: rng.random() * W,
      y0: rng.random() * SPAN,
      r: rng.between(70, 120),
      par: 0.08,
      color: rng.random() < 0.5 ? "rgba(120,90,255,0.16)" : "rgba(60,160,255,0.13)",
    }));
  } else if (world.kind === "candy") {
    decor.puffs = spread(7, () => ({
      x: rng.random() * W,
      y0: rng.random() * SPAN,
      r: rng.between(22, 40),
      par: rng.between(0.1, 0.28),
    }));
    decor.sprinkles = spread(34, () => ({
      x: rng.random() * W,
      y0: rng.random() * SPAN,
      rot: rng.random() * Math.PI,
      color: ["#ff6fa8", "#ffd166", "#7bdcff", "#b69cff"][rng.randrange(4)],
      par: rng.between(0.15, 0.4),
    }));
    decor.lollipops = spread(3, () => ({
      x: rng.between(30, W - 30),
      y0: rng.random() * SPAN,
      r: rng.between(14, 22),
      par: 0.18,
      color: ["#ff6fa8", "#7bdcff", "#ffd166"][rng.randrange(3)],
    }));
  }
  return decor;
}

function drawStars(ctx, decor, camera, time, strength) {
  if (strength <= 0.02) return;
  decor.stars.forEach((s) => {
    const y = wrapY(s.y0 + camera * s.par);
    const twinkle = 0.6 + 0.4 * Math.sin(time * 2 + s.tw);
    ctx.globalAlpha = strength * twinkle;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(s.x, y, s.r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawScenery(ctx, world, decor, camera, time, altitude) {
  switch (world.kind) {
    case "city": {
      drawStars(ctx, decor, camera, time, 0.55 + altitude * 0.4);
      decor.layers.forEach((layer, n) => {
        const base = GROUND_Y + camera * layer.par;
        ctx.fillStyle = n === 0 ? "#1a0f3d" : "#241354";
        layer.items.forEach((b) => {
          ctx.fillRect(b.x, base - b.h, b.w, b.h + 200);
        });
        ctx.fillStyle = n === 0 ? "rgba(255,79,216,0.45)" : "rgba(139,92,255,0.7)";
        layer.items.forEach((b) => {
          b.windows.forEach(([wx, wy]) => ctx.fillRect(b.x + wx, base - b.h + wy, 4, 5));
        });
      });
      break;
    }
    case "sunset": {
      drawStars(ctx, decor, camera, time, altitude * 0.8);
      const sy = 170 + camera * 0.1;
      const grad = ctx.createRadialGradient(W * 0.7, sy, 8, W * 0.7, sy, 70);
      grad.addColorStop(0, "#fff3c4");
      grad.addColorStop(0.45, "#ffb067");
      grad.addColorStop(1, "rgba(255,120,90,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(W * 0.7, sy, 70, 0, Math.PI * 2);
      ctx.fill();
      decor.clouds.forEach((c) => {
        const x = ((c.x + time * c.drift) % (W + 140)) - 70;
        const y = wrapY(c.y0 + camera * c.par);
        ctx.fillStyle = "rgba(255,214,200,0.28)";
        roundRect(ctx, x, y, c.w, 14, 7);
        ctx.fill();
        roundRect(ctx, x + c.w * 0.2, y - 8, c.w * 0.5, 14, 7);
        ctx.fill();
      });
      decor.hills.forEach((h) => {
        const base = GROUND_Y + camera * h.par;
        ctx.fillStyle = h.fill;
        ctx.beginPath();
        ctx.moveTo(0, base + 200);
        for (let x = 0; x <= W; x += 8) {
          ctx.lineTo(x, base - 20 - h.amp * (0.5 + 0.5 * Math.sin(x * h.freq * 6 + h.phase)));
        }
        ctx.lineTo(W, base + 200);
        ctx.closePath();
        ctx.fill();
      });
      break;
    }
    case "ocean": {
      decor.rays.forEach((r) => {
        ctx.fillStyle = `rgba(190,240,255,${r.a * (0.5 + altitude)})`;
        ctx.beginPath();
        ctx.moveTo(r.x, 0);
        ctx.lineTo(r.x + r.w, 0);
        ctx.lineTo(r.x + r.w * 2.2, H);
        ctx.lineTo(r.x + r.w * 0.9, H);
        ctx.closePath();
        ctx.fill();
      });
      decor.bubbles.forEach((b) => {
        const y = wrapY(b.y0 - time * b.speed + camera * b.par);
        const x = b.x + Math.sin(time + b.wob) * 5;
        ctx.strokeStyle = "rgba(200,245,255,0.5)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, b.r, 0, Math.PI * 2);
        ctx.stroke();
      });
      break;
    }
    case "space": {
      drawStars(ctx, decor, camera, time, 1);
      decor.nebula.forEach((n) => {
        const y = wrapY(n.y0 + camera * n.par);
        const g = ctx.createRadialGradient(n.x, y, 4, n.x, y, n.r);
        g.addColorStop(0, n.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(n.x - n.r, y - n.r, n.r * 2, n.r * 2);
      });
      decor.planets.forEach((p) => {
        const y = p.y0 + camera * p.par;
        const g = ctx.createRadialGradient(p.x - p.r * 0.35, y - p.r * 0.35, 2, p.x, y, p.r);
        g.addColorStop(0, "#ffffff");
        g.addColorStop(0.25, p.color);
        g.addColorStop(1, "#0b0f2a");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, y, p.r, 0, Math.PI * 2);
        ctx.fill();
        if (p.ring) {
          ctx.strokeStyle = "rgba(190,200,255,0.55)";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.ellipse(p.x, y, p.r * 1.7, p.r * 0.45, -0.35, 0, Math.PI * 2);
          ctx.stroke();
        }
      });
      break;
    }
    case "candy": {
      decor.puffs.forEach((p) => {
        const y = wrapY(p.y0 + camera * p.par);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        [[0, 0, 1], [p.r * 0.9, p.r * 0.2, 0.75], [-p.r * 0.9, p.r * 0.25, 0.7]].forEach(([dx, dy, k]) => {
          ctx.beginPath();
          ctx.arc(p.x + dx, y + dy, p.r * k, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      decor.lollipops.forEach((l) => {
        const y = wrapY(l.y0 + camera * l.par);
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillRect(l.x - 1.5, y, 3, 46);
        ctx.fillStyle = l.color;
        ctx.beginPath();
        ctx.arc(l.x, y, l.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.8)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(l.x, y, l.r * 0.55, 0, Math.PI * 1.5);
        ctx.stroke();
      });
      decor.sprinkles.forEach((s) => {
        const y = wrapY(s.y0 + camera * s.par);
        ctx.save();
        ctx.translate(s.x, y);
        ctx.rotate(s.rot);
        ctx.fillStyle = s.color;
        ctx.fillRect(-5, -1.5, 10, 3);
        ctx.restore();
      });
      break;
    }
    default:
  }
}

// ---------- effects ----------
export function createFx() {
  return { camera: 0, time: 0, shake: 0, rings: [], sparks: [], texts: [] };
}

// Advance camera and particles, and turn game events into effects.
export function stepFx(fx, g, dt, reducedMotion) {
  fx.time += dt;
  const target = Math.max(0, (g.floors - 4) * BLOCK_H);
  fx.camera += (target - fx.camera) * Math.min(1, dt * 5);

  g.events.splice(0).forEach((ev) => {
    if (ev.type === "perfect") {
      fx.rings.push({ x: ev.x, w: ev.w, level: ev.level, age: 0 });
      fx.texts.push({
        text: ev.streak >= 2 ? `Perfect x${ev.streak}` : "Perfect!",
        x: ev.x + ev.w / 2,
        level: ev.level,
        age: 0,
      });
      const count = reducedMotion ? 0 : 12;
      for (let i = 0; i < count; i++) {
        const side = i % 2 ? 1 : -1;
        fx.sparks.push({
          x: ev.x + (side > 0 ? ev.w : 0),
          level: ev.level,
          vx: side * (30 + Math.random() * 90),
          vy: 60 + Math.random() * 120,
          dy: 0,
          age: 0,
        });
      }
    } else if (ev.type === "miss" && !reducedMotion) {
      fx.shake = 0.5;
    }
  });

  fx.shake = Math.max(0, fx.shake - dt);
  fx.rings.forEach((r) => (r.age += dt));
  fx.rings = fx.rings.filter((r) => r.age < 0.5);
  fx.texts.forEach((t) => (t.age += dt));
  fx.texts = fx.texts.filter((t) => t.age < 0.9);
  fx.sparks.forEach((s) => {
    s.age += dt;
    s.x += s.vx * dt;
    s.vy -= 380 * dt;
    s.dy -= s.vy * dt; // positive vy = moves up on screen
  });
  fx.sparks = fx.sparks.filter((s) => s.age < 0.7);
}

// ---------- tower ----------
const levelY = (level, camera) => GROUND_Y - (level + 1) * BLOCK_H + camera;

function drawBlock(ctx, world, level, x, w, camera, { dy = 0, alpha = 1, glow = 10 } = {}) {
  const y = levelY(level, camera) + dy;
  if (y > H + 40 || y < -BLOCK_H - 40) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.shadowColor = world.glow;
  ctx.shadowBlur = glow;
  ctx.fillStyle = blockColor(world, level);
  roundRect(ctx, x, y, w, BLOCK_H - 2, 4);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "rgba(255,255,255,0.28)";
  ctx.fillRect(x + 3, y + 2, Math.max(0, w - 6), 3);
  ctx.restore();
}

export function draw(ctx, g, world, decor, fx) {
  const altitude = Math.min(1, fx.camera / 900);
  ctx.save();
  if (fx.shake > 0) ctx.translate((Math.random() - 0.5) * 10 * fx.shake * 2, (Math.random() - 0.5) * 10 * fx.shake * 2);

  // sky: blends toward a darker tone as the tower climbs
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, mix(world.sky.lowTop, world.sky.highTop, altitude));
  sky.addColorStop(1, mix(world.sky.lowBottom, world.sky.highBottom, altitude));
  ctx.fillStyle = sky;
  ctx.fillRect(-20, -20, W + 40, H + 40);

  drawScenery(ctx, world, decor, fx.camera, fx.time, altitude);

  // ground slab under the base block
  const gy = GROUND_Y + fx.camera;
  if (gy < H + 10) {
    ctx.fillStyle = "rgba(4,3,14,0.82)";
    ctx.fillRect(-20, gy, W + 40, H);
    ctx.fillStyle = world.glow;
    ctx.globalAlpha = 0.7;
    ctx.fillRect(-20, gy, W + 40, 2);
    ctx.globalAlpha = 1;
  }

  g.blocks.forEach((b, level) => drawBlock(ctx, world, level, b.x, b.w, fx.camera));
  g.debris.forEach((d) => drawBlock(ctx, world, d.level, d.x, d.w, fx.camera, { dy: d.dy, alpha: d.alpha, glow: 0 }));

  // guide: lines where the next block should land
  if (g.guide && !g.over) {
    const top = g.blocks[g.blocks.length - 1];
    const yTop = levelY(g.mover.level, fx.camera);
    const yBottom = levelY(g.blocks.length - 1, fx.camera);
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.09)";
    ctx.fillRect(top.x, yTop, top.w, yBottom - yTop);
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    [top.x, top.x + top.w].forEach((x) => {
      ctx.beginPath();
      ctx.moveTo(x, yTop);
      ctx.lineTo(x, yBottom);
      ctx.stroke();
    });
    ctx.restore();
  }

  if (!g.over) drawBlock(ctx, world, g.mover.level, g.mover.x, g.mover.w, fx.camera, { glow: 20 });

  // perfect rings, sparks and pop-up text
  fx.rings.forEach((r) => {
    const t = r.age / 0.5;
    const y = levelY(r.level, fx.camera);
    ctx.strokeStyle = `rgba(255,255,255,${1 - t})`;
    ctx.lineWidth = 2;
    roundRect(ctx, r.x - t * 14, y - t * 8, r.w + t * 28, BLOCK_H - 2 + t * 16, 6);
    ctx.stroke();
  });
  fx.sparks.forEach((s) => {
    ctx.fillStyle = `rgba(255,255,255,${1 - s.age / 0.7})`;
    ctx.fillRect(s.x - 1.5, levelY(s.level, fx.camera) + 8 + s.dy, 3, 3);
  });
  fx.texts.forEach((t) => {
    const k = t.age / 0.9;
    ctx.globalAlpha = 1 - k;
    ctx.fillStyle = "#ffffff";
    ctx.font = "800 15px system-ui, -apple-system, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    ctx.shadowColor = world.glow;
    ctx.shadowBlur = 10;
    ctx.fillText(t.text, t.x, levelY(t.level, fx.camera) - 8 - k * 26);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  });

  ctx.restore();
}
