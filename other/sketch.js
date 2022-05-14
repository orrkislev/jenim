/// <reference path="./p5.global-mode.d.ts" />

const random = (a = 1, b = 0) => fxrand() * (b - a) + a
const choose = (arr) => arr[Math.floor(random(arr.length))]
const getColor = () => R.random_choice(colors)

const pallete1 = ['#a7dfff', '#467194', '#b07967', '#78544c']
const pallete2 = ['#fd0155', '#fa76c6']
const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const happy = ['#fca311', '#9d0208', '#ae2012', '#ffadad',]

const grayscale1 = ['#999', '#555']
const grayscale2 = ['#333', '#222', '#111']
const bgColor = ['#969387', '#f0eee6', '#54635e']

const BG = '#ffcf40'
const colors = bgColor
const pencilColor = '#444'
const highlightColors = gold

function setup() {
    createCanvas(1000, 1000);
    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()
    makeImage()
}

function makeImage() {
    translate(width / 2, height / 2)
    // rotate(random(-30, 30))
    translate(-width / 2, -height / 2)

    background('#495478')
    drawDenimTexture()
    drawLint()

    drawHole()

    resetMatrix()
    addBG()
    finishImage()
}

function drawHole() {
    translate(width/2,height/2)
    holeSize = 300
    s = new RoundShape(0, 0, holeSize, 45)
    s.ps.forEach(p => p.y *= 0.8)
    s.wonky(1)
    s.prepareTransfer()

    blendMode(REMOVE)
    fill(0)
    s.fill()
    blendMode(BLEND)
    noFill()

    strokeWeight(4)
    for (let i = 0; i < holeSize; i += 4) {
        const t = 1 - i / holeSize
        const y = s.y2y(t)
        const xRange = s.getXRange(t)
        xRange[0] += random(-2, 2)
        xRange[1] += random(-2, 2)
        x1 = xRange[0]
        x2 = lerp(xRange[0], xRange[1], 0.3)
        x3 = lerp(xRange[0], xRange[1], 0.6)
        x4 = xRange[1]
        y1 = y
        y2 = y + random(-1, 2) * 4
        y3 = y + random(-1, 2) * 4
        y4 = y

        translate(0, 1)
        stroke(0, 80)
        beginShape()
        curveVertex(x1, y1)
        curveVertex(x1, y1)
        curveVertex(x2, y2)
        curveVertex(x3, y3)
        curveVertex(x4, y4)
        curveVertex(x4, y4)
        endShape()

        translate(0, -1)
        stroke(255)
        beginShape()
        curveVertex(x1, y1)
        curveVertex(x1, y1)
        curveVertex(x2, y2)
        curveVertex(x3, y3)
        curveVertex(x4, y4)
        curveVertex(x4, y4)
        endShape()
    }

    strokeWeight(0.2)
    blu = color('#495478')
    whit = color('#ffffff')
    for (let i = 0; i < holeSize; i++) {
        const t = 1 - i / holeSize
        const y = s.y2y(t)
        const xRange = s.getXRange(t)
        const threads = random(0,3)
        for (let j = 0; j < threads; j++) {
            const pos = createVector(R.random_choice(xRange), y)
            pos.x += random(-2, 2)
            stroke(lerpColor(blu,whit,random()))
            const dir = p5.Vector.fromAngle(random(360))
            const l = random(60,120)
            for (let h = 0; h < l; h++) {
                dir.rotate(random(-1, 1))
                pos.add(dir)
                point(pos.x, pos.y)
            }
        }
    }
}

function drawLint() {
    strokeWeight(0.8)
    stroke(255,50)
    for (let i=0;i<10;i++){
        const p = createVector(random(width),random(height))
        const dir = p5.Vector.random2D().mult(5)
        const l = random(5,10)
        beginShape()
        for (let j=0;j<l;j++){
            dir.rotate(random(-5,5))
            p.add(dir)
            curveVertex(p.x,p.y)
        }
        endShape()
    }
}

function drawDenimTexture() {
    threadSize = 9

    fabricEnds = []
    const pos1 = createVector(-100, -100)
    const pos2 = createVector(width + 100, -100)
    const dir1 = 90
    const dir2 = 90
    for (let x = -100; x < width + 100; x += threadSize + 1) {
        pos1.add(p5.Vector.fromAngle(dir1 + random(-5, 5)))
        pos2.add(p5.Vector.fromAngle(dir2 + random(-5, 5)))
        fabricEnds.push([pos1, pos2])
    }

    pattern = []
    for (let x = -100; x < width + 100; x += threadSize + 1) {
        row = []
        for (let y = -100 + random(threadSize); y < height + 100; y += threadSize + 1) {
            threadSize = map(dist(x,y,width/2,height/2),0,width,9,30)
            row.push(createVector(x, y))
        }
        pattern.push(row)
    }

    pattern.forEach(row => {
        row.forEach(p => {
            let val = noise(p.x / 800, p.y / 800)
            strokeWeight(val * 7)
            stroke(255, val * 200)
            // line(p.x - threadSize * random(0.8, 1), p.y - threadSize * random(0.8, 1), p.x, p.y)
            line(p.x + threadSize * random(0.8, 1), p.y - threadSize * random(0.8, 1), p.x, p.y)
        })
    })

}












function addBG() {
    const fg_image = get()
    background(220)
    var gradient = drawingContext.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, width);
    gradient.addColorStop(0, 'rgba(220,220,220,0)');
    gradient.addColorStop(1, '#777');
    drawingContext.fillStyle = gradient
    rect(0, 0, width, height)
    image(fg_image, 0, 0)
}










// ~~~~~~~~~~~~~~~~~~~~~~~~ 
// ~~~~~~~~~~~~~~~~~~~~~~~~ DRAWING
// ~~~~~~~~~~~~~~~~~~~~~~~~ 
allDots = 0
function myRect(x, y, w, h) {
    myLine(x - w / 2, y - h / 2, x + w / 2, y - h / 2)
    myLine(x + w / 2, y - h / 2, x + w / 2, y + h / 2)
    myLine(x + w / 2, y + h / 2, x - w / 2, y + h / 2)
    myLine(x - w / 2, y + h / 2, x - w / 2, y - h / 2)
}

function myLine(x1, y1, x2, y2) {
    myLineV(createVector(x1, y1), createVector(x2, y2))
}

function myLineV(v1, v2) {
    const l = p5.Vector.dist(v1, v2)
    for (let i = 0; i < l; i++) {
        const v = p5.Vector.lerp(v1, v2, i / l)
        circle(v.x, v.y, random(3))
        allDots++
    }
}

function myEllipse(x, y, w, h) {
    const steps = round(PI + (w + h) / 2)
    const ew = w * 0.675

    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        const px = bezierPoint(x, x + ew, x + ew, x, t);
        const py = bezierPoint(y - h / 2, y - h / 2, y + h / 2, y + h / 2, t);
        circle(px, py, random(3));
        allDots++
    }
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        const px = bezierPoint(x, x - ew, x - ew, x, t);
        const py = bezierPoint(y - h / 2, y - h / 2, y + h / 2, y + h / 2, t);
        circle(px, py, random(3));
        allDots++
    }
}

function myArc(x, y, w, h, s, e) {
    ps = getArcPoints(x, y, w, h, s, e)
    ps.forEach(p => circle(p.x, p.y, random(3)))
    allDots += ps.length
}

function getArcPoints(x, y, w, h, s, e) {
    const steps = round((PI + (w + h) / 2))
    const eh = h * 0.675

    let points = []

    for (let i = steps * min(s, 1); i <= steps * (min(e, 1)); i++) {
        let t = i / steps;
        const px = bezierPoint(x - w / 2, x - w / 2, x + w / 2, x + w / 2, t);
        const py = bezierPoint(y, y + eh, y + eh, y, t);
        points.push(createVector(px, py))
    }

    if (e > 1) {
        e = e - 1
        s = s > 1 ? s - 1 : 0
        for (let i = steps * min(s, 1); i <= steps * (min(e, 1)); i++) {
            let t = i / steps;
            const px = bezierPoint(x + w / 2, x + w / 2, x - w / 2, x - w / 2, t);
            const py = bezierPoint(y, y - eh, y - eh, y, t);
            points.push(createVector(px, py))
        }
    }
    return points
}







const shade_round = [[0.0, 0.5], [0.2, 0.0], [0.5, 0.0], [0.75, 0.5], [1.0, 1.0]]
const shade_round_shiny = [[0.0, 0.5], [0.1, 0.0], [0.1, 0.3], [0.3, 0], [0.4, 0], [0.6, 1], [0.8, 0.3], [0.9, 0], [1.0, 1.0]]
const shade_hex = [
    [0.00, 0.2], [0.25, 0.5],
    [0.25, 0.0], [0.50, 0.0],
    [0.50, 0.8], [0.75, 0.2],
    [0.75, 1.0], [1.00, 0.5]]
const shade_point = [
    [0.0, 0.4], [0.2, 0.1], [0.5, 0.0],
    [0.5, 0.6], [0.8, 0.2], [1.0, 0.6],
]
const shade_flat = [
    [0.0, 1.0],
    [0.25, 1.0],
    [0.5, 1.0],
    [0.8, 1.0],
    [0.9, 1.0],
    [1.0, 1.0]
]

const allShades = [shade_point]
