/// <reference path="./p5.global-mode.d.ts" />

const random = (a = 1, b = 0) => fxrand() * (b - a) + a
const choose = (arr) => arr[Math.floor(random(arr.length))]

const pallete1 = ['#a7dfff', '#467194', '#b07967', '#78544c']
const pallete2 = ['#fd0155', '#fa76c6']
const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const happy = ['#fca311', '#9d0208', '#ae2012', '#ffadad',]

const denimOptions = [
    ['#517dae', '#25319C'], ['#2b2d42', '#03071e'],
    ['#88C0EE', '#BCDBF0'], ['#ff0000', '#ff0000']
]
const natural = ['#f1edec', '#ffffff', '#fefae0', '#e6f5fa', '#fcfcfc']

const warpColors = natural
const denimColor = denimOptions[0]
let stitchColor = gold[1]

const grayscale1 = ['#999', '#555']
const grayscale2 = ['#333', '#222', '#111']
const bgColor = ['#969387', '#f0eee6', '#54635e']

const BG = '#ffcf40'

let initialThreadSize = 3
let threadSize = initialThreadSize

function setup() {
    createCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
    angleMode(DEGREES)
    initialThreadSize = width / 1000 * initialThreadSize
    stitchColor = color(stitchColor)
    noLoop()
    noStroke()
    noFill()
    makeImage()
}


async function makeImage() {
    clear()

    fullPattern = new LayoutPattern([v(0, 0), v(width, 0), v(width, height), v(0, height)])
    denim = new Denim(fullPattern, denimColor)
    denim.visibleWhite = 1
    denim.rotate(180)
    await denim.draw()

    blendMode(DODGE)
    fill(200,200,255,30)
    noStroke()
    rect(0,0,width,height)
    blendMode(BLEND)

    denim = new Denim(fullPattern, denimColor)
    denim.colorFunc = (clr, x, y) => {
        const noiseVal = noise(x / 200, y / 200, 0.8)
        if (noiseVal > 0.5) clr = lerpColor(clr, color(255), noiseVal / 2)
        return clr
    }
    denim.makeHole()

    await denim.draw()
    await denim.drawHoleStuff()
    //await pocket()



    noStroke()
    resetMatrix()
    p = get()
    blendMode(SOFT_LIGHT)
    image(p, 0, 0)
    blendMode(BLEND)

    addBG()
    finishImage()
}

async function pocket() {
    // l = new LayoutPattern([v_rel(0.3, -0.1), v_rel(0.32, -0.12), v_rel(0.5, 0.5), v_rel(0.52, 0.52), v_rel(1.1, 0.7), v_rel(1.1, -0.1)])
    l = new LayoutPattern([v_rel(-0.1, 0.5), v_rel(.2, .2), v_rel(.7, .6), v_rel(1.1, 0.3), v_rel(1.1, -0.1), v(-0.1, -0.1)])
    // l = new LayoutPattern([v_rel(0.6,-0.1),v_rel(0.7,0.5), v_rel(0.8,0.5), v_rel(0.7,-0.1)])
    await l.goAlong(async p => await burn(p, 70, 20))
    await l.goAlong(async p => await burn(p, 40, 20))
    await l.goAlong(async p => await burn(p, 20, 20))

    denim2 = new Denim(l, denimColor)
    denim2.drawBorderShadows = true
    await denim2.draw()

    l.offset(4)
    await l.goAlong(async p => await dodge(p, 8, 80))
    await l.goAlong(async p => await dodge(p, 5, 80))

    l.offset(6)
    await l.goAlong(async p => await dodge(p, 10, 7))

    l.offset(10)
    for (st of l.stitches()) {
        threadSize = initialThreadSize * 2
        for (let i = 0; i < 1; i += 0.3) {
            await burn(p5.Vector.lerp(st[0], st[1], i), threadSize * 3, 40)
            await burn(p5.Vector.lerp(st[0], st[1], i), threadSize * 2, 20)
        }
        await thread(st, stitchColor)
    }

    l.offset(20)
    for (let i = 0; i < l.ps.length; i += 3) {
        const v = sin(i * 8)
        if (v > 0) {
            await burn(l.ps[i], random(30, 60), 10)
            await burn(l.ps[i], 20, 30)
        } else {
            await dodge(l.ps[i], random(30, 60), 10)
        }
    }

    l.offset(20)
    for (st of l.stitches()) {
        for (let i = 0; i < 1; i += 0.3) {
            await burn(p5.Vector.lerp(st[0], st[1], i), threadSize * 3, 40)
            await burn(p5.Vector.lerp(st[0], st[1], i), threadSize * 2, 20)
        }
        await thread(st, stitchColor)
    }

    l.offset(25)
    await l.goAlong(async p => await dodge(p, 20, 10))

    l.offset(10)
    await l.goAlong(async p => await burn(p, 20, 10))
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function drawDot_empty() {
    allDots++
    if (allDots % 10000 == 0) await timeout(0);
}
async function drawDot(p) {
    allDots++
    if (allDots % 10000 == 0) await timeout(0);
    point(p.x, p.y)
}

function makeStitch(stitchPattern) {
    threadSize = initialThreadSize * 1.5
    for (let i = 0; i < stitchPattern.ps.length - 1; i++) {
        const p1 = stitchPattern.ps[i]
        const p2 = stitchPattern.ps[i + 1]
        const dir = p5.Vector.sub(p2, p1)
        dir.setMag(threadSize * 10)
        const l = p5.Vector.dist(p1, p2)
        const stitchPos = p1.copy()
        for (let j = 0; j < l - threadSize * 15; j += threadSize * 15) {
            stitchPos2 = p5.Vector.add(stitchPos, dir)
            mid = p5.Vector.add(stitchPos, stitchPos2).div(2)
            midChange = mid.copy().rotate(90).setMag(threadSize).mult(random(0, 1))
            mid.add(midChange)
            thread([stitchPos, mid, stitchPos2], gold[0])
            stitchPos.add(dir)
            stitchPos.add(dir)
        }
    }
}

async function dodge(p, size, force = 7) {
    blendMode(DODGE)
    stroke(200, 200, 255, force)
    // noStroke()
    // circle(p.x, p.y, size * random(0.4, 1))
    await softBrush(p, size)
    blendMode(BLEND)
}

async function burn(p, size, force = 7) {
    blendMode(BURN)
    stroke(30, 30, 90, force)
    // noStroke()
    // circle(p.x, p.y, size * random(0.4, 1))
    await softBrush(p, size)
    blendMode(BLEND)
}
async function softBrush(p, r) {
    for (let i = 0; i < r * 10; i++) {
        const rr = random() * r / 2
        const a = random(360)
        strokeWeight(random(2))
        await drawDot(p.copy().add(cos(a) * rr, sin(a) * rr))
    }
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