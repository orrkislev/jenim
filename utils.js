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
const v_rel = (x, y) => createVector(x * baseWidth, y * baseHeight)

let startTime = 0
const initTimer = ()=>startTime = performance.now()
const getTime = ()=>{
  const newTime = performance.now()
  const res = newTime-startTime
  startTime = newTime
  return res
}