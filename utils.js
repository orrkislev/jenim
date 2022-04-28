const random = (a = 1, b = 0) => Math.random() * (b - a) + a
const choose = (arr) => arr[Math.floor(random(arr.length))]
const round_random = (a, b) => Math.floor(random(a, b + 1))
const random_in = (minMax) => random(minMax[0], minMax[1])


let finalImage
function finishImage() {
  finalImage = get()
  if (min(windowWidth, windowHeight) != width)
    windowResized()
}

function windowResized() {
  if (finalImage) {
    resizeCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
    resetMatrix()
    image(finalImage, 0, 0, width, height)
  }
}

function preload() {
  if (typeof preloadShader === "function") preloadShader()
  if (typeof preloadFont === "function") preloadFont()
  if (typeof preloadImage === "function") preloadImage()
}

// let myFont
// function preloadFont(){
//     myFont = loadFont('comic.TTF')
// }

p5.Color.prototype.toRGB = function toRGB() {
  return color(red(this), green(this), blue(this), alpha(this))
}

Array.prototype.get = function get(i) {
  return this[i % this.length]
}
Array.prototype.rotate = function rotate() {
  this.push(this.shift())
  return this[0]
}


const v = (x, y) => createVector(x, y)
const v_rel = (x, y) => createVector(x * width, y * height)

p5.Vector.prototype.cmult = function cmult(t) {
  return this.copy().mult(t)
};

p5.Vector.prototype.cmag = function cmag(t) {
  const c = this.copy().setMag(abs(t))
  if (t < 0) c.mult(-1)
  return c
};
const VectorFromAngle = (a, m = 1) => p5.Vector.fromAngle(radians(a)).setMag(m)

const fit = (v) => width * v / 1000

let startTime = 0
const initTimer = ()=>startTime = performance.now()
const getTime = ()=>{
  const newTime = performance.now()
  const res = newTime-startTime
  startTime = newTime
  return res
}