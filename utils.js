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






const v = (x, y) => createVector(x, y)
const v_rel = (x, y) => createVector(x*width, y*height)

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