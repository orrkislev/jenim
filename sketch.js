/// <reference path="./p5.global-mode.d.ts" />

const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

const warpColors = natural
let stitchColor

const BG = '#666'

let initialThreadSize = 3
let threadSize = initialThreadSize

function setup() {
    if (windowWidth * (16 / 9) > windowHeight) canvas = createCanvas(windowHeight / (16 / 9), windowHeight);
    else canvas = createCanvas(windowWidth, windowWidth * (16 / 9))
    print(canvas)
    // drawingContext = canvas.canvas.getContext('2d', { alpha: false });
    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    ripNoiseScale = [random(5, 10), random(5, 10)]
    initialThreadSize = width / 1000 * initialThreadSize
    makeImage()
}

async function makeImage() {
    // for (let i = 0; i < 100; i++) {
        // randomSeed(Math.random()*10000)
        // noiseSeed(Math.random()*10000)
        // ripNoiseScale = [random(5, 15), random(5, 15)]
        initDenimParams()
        initBaseColor()
        initColorFunc()
        
        background(BG)
        let composition = choose(compositions)
        composition = withFringe
        await composition()

        // saveCanvas(`img ${i}`, 'jpg')
    // }
}