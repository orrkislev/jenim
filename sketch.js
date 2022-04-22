/// <reference path="./p5.global-mode.d.ts" />

const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

const warpColors = natural
let stitchColor

const BG = '#666'

let initialThreadSize = 3
let threadSize = initialThreadSize
let globalColorFunc

function setup() {
    noiseSeed(99)
    randomSeed(99)
    canvas = createCanvas(min(windowWidth * 0.61, windowHeight * 0.61), min(windowWidth, windowHeight));
    angleMode(DEGREES)
    initialThreadSize = width / 1000 * initialThreadSize
    noLoop()
    noStroke()
    noFill()
    makeImage()
}

async function makeImage() {
    background(BG)

    initBaseColor()
    globalColorFunc = choose(colorFuncs)
    const composition = choose(compositions)
    await composition()
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
    fill(30, 30, 90, force)
    noStroke()
    circle(p.x, p.y, size * random(0.4, 1))
    // await softBrush(p, size)
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