/// <reference path="./p5.global-mode.d.ts" />

const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

const warpColors = natural
let stitchColor

const BG = '#666'

let initialThreadSize = 3
let threadSize = initialThreadSize
let globalColorFunc = null

function setup() {
    if (windowWidth * (16/9) > windowHeight) canvas = createCanvas(windowHeight / (16/9), windowHeight);
    else canvas = createCanvas(windowWidth,windowWidth * (16/9))
    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    ripNoiseScale = [random(5,15), random(5,15)]
    initialThreadSize = width / 1000 * initialThreadSize
    makeImage()
}

async function makeImage() {
    background(BG)

    initBaseColor()
    globalColorFunc = choose(colorFuncs)
    const composition = choose(compositions)
    // composition = patches
    await composition()
}