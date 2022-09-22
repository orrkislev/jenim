/// <reference path="../p5.global-mode.d.ts" />

const warpColors = natural
let stitchColor

const BG = '#666'
const baseWidth = 1000
const baseHeight = baseWidth * (7 / 5)
let globalScale;

function setup() {
    noiseSeed(R.random_int(20000))

    if (windowWidth * (7 / 5) > windowHeight) canvas = createCanvas(windowHeight / (7 / 5), windowHeight);
    else canvas = createCanvas(windowWidth, windowWidth * (7 / 5))
    globalScale = width / baseWidth

    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    ripNoiseScale = [R.random(5, 10), R.random(5, 10)]
    initialThreadSize = R.random(2.5, 3.5)
    threadSize = initialThreadSize

    const d = new Date()
    const fullYears = d.getFullYear() - 2023
    const years = fullYears + d.getMonth() / 12
    globalAge = constrain(years / 10, 0, 1)

    makeImage()
}

async function makeImage() {
    background(BG)
    fill(255)
    textSize(10)
    textAlign(CENTER, CENTER)
    text('Loading Jenim', width/2,height/2)
    noFill()
    await timeout(30)

    initDenimParams()
    initBaseColor()
    initColorFunc()

    let composition = R.random_choice(compositions)
    print(composition.name)
    // composition = patches
    await composition()
    print('done')
}