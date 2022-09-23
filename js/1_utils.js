// --- AB Random

class Random {
  constructor() {
      this.usage = 0
      this.useA = false;
      let sfc32 = function (uint128Hex) {
          let a = parseInt(uint128Hex.substr(0, 8), 16);
          let b = parseInt(uint128Hex.substr(8, 8), 16);
          let c = parseInt(uint128Hex.substr(16, 8), 16);
          let d = parseInt(uint128Hex.substr(24, 8), 16);
          return function () {
              a |= 0; b |= 0; c |= 0; d |= 0;
              let t = (((a + b) | 0) + d) | 0;
              d = (d + 1) | 0;
              a = b ^ (b >>> 9);
              b = (c + (c << 3)) | 0;
              c = (c << 21) | (c >>> 11);
              c = (c + t) | 0;
              return (t >>> 0) / 4294967296;
          };
      };
      // seed prngA with first half of tokenData.hash
      this.prngA = new sfc32(tokenData.hash.substr(2, 32));
      // seed prngB with second half of tokenData.hash
      this.prngB = new sfc32(tokenData.hash.substr(34, 32));
      for (let i = 0; i < 1e6; i += 2) {
          this.prngA();
          this.prngB();
      }
  }
  // random number between 0 (inclusive) and 1 (exclusive)
  random_dec() {
      this.usage++
      this.useA = !this.useA;
      return this.useA ? this.prngA() : this.prngB();
  }
  // random number between a (inclusive) and b (exclusive)
  random_num(a, b) {
      return a + (b - a) * this.random_dec();
  }
  // random integer between a (inclusive) and b (inclusive)
  // requires a < b for proper probability distribution
  random_int(a, b) {
      return Math.floor(this.random_num(a, b + 1));
  }
  // random value in an array of items
  random_choice(list) {
      return list[this.random_int(0, list.length - 1)];
  }

  random(a = 1, b = 0){ return this.random_num(a,b) }
  random_in(minMax){ return this.random_num(minMax[0], minMax[1]) }
}

let R = new Random()

// --- UTILS

p5.Color.prototype.toRGB = function toRGB() {
  return color(red(this), green(this), blue(this), alpha(this))
}

Array.prototype.rotate = function rotate() {
  this.push(this.shift())
  return this[0]
}

const v = (x, y) => createVector(x, y)
const v_rel = (x, y) => createVector(x * baseWidth, y * baseHeight)

// --- DRAW

let allDots = 0
async function drawDot(p) {
    allDots++
    if (allDots % 20000 == 0) await timeout(0);
    point(p.x, p.y)
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function burn(p, size, force = 7) {
    blendMode(BURN)
    fill(30, 30, 90, force)
    noStroke()
    circle(p.x, p.y, size * R.random(0.4, 1))
    // await softBrush(p, size)
    blendMode(BLEND)
}

// --- GEOMETRY

function getPointOnEllipse(w, h, a) {
  return createVector(w * 0.5 * cos(a), h * 0.5 * sin(a))
}
function getEllipse(w, h, step = 1, s = 0, e = 360) {
  const ps = []
  for (let a = s; a < e; a += step) ps.push(getPointOnEllipse(w, h, a))
  return ps
}

function makeCurve(crv) {
  crv.push(crv[crv.length - 1])
  crv.splice(0, 0, crv[0])

  const newCrv = []
  for (let i = 0; i < crv.length - 3; i++) {
      const nextP = crv[i + 1]
      const nextnextP = crv[i + 2]
      const l = p5.Vector.dist(nextP, nextnextP)
      for (let t = 0; t < l; t++) {
          x = curvePoint(crv[i].x, crv[i + 1].x, crv[i + 2].x, crv[i + 3].x, t / l)
          y = curvePoint(crv[i].y, crv[i + 1].y, crv[i + 2].y, crv[i + 3].y, t / l)
          newCrv.push(createVector(x, y))
      }
  }
  return newCrv
}

function crvLength(crv) {
  l = 0
  for (let i=0;i<crv.length-1;i++){
      l += p5.Vector.dist(crv[i], crv[i+1])
  }
  return l
}

function placeOnCurve(crv,d){
  let l = 0
  for (let i=0;i<crv.length-1;i++){
      l += sqrt((crv[i].x - crv[i+1].x) ** 2 + (crv[i].y - crv[i+1].y) ** 2)
      if (l>=d) return crv[i]
  }
  return false
}