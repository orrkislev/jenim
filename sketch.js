/// <reference path="./p5.global-mode.d.ts" />

const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

const warpColors = natural
let stitchColor

const BG = '#666'
const baseWidth = 1000
const baseHeight = baseWidth * (16/9)
let globalScale;

function setup() {
    noiseSeed(R.random_int(20000))

    if (windowWidth * (16 / 9) > windowHeight) canvas = createCanvas(windowHeight / (16 / 9), windowHeight);
    else canvas = createCanvas(windowWidth, windowWidth * (16 / 9))

    globalScale = width / baseWidth

    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    ripNoiseScale = [R.random(5, 10), R.random(5, 10)]
    initialThreadSize = 3
    // initialThreadSize = width / 1000 * initialThreadSize
    threadSize = initialThreadSize
    makeImage()
}

async function makeImage() {
    // for (let i = 0; i < 100; i++) {
        // randomSeed(Math.random()*10000)
        // noiseSeed(Math.random()*10000)
        // ripNoiseScale = [random(5, 15), random(5, 15)]
        initThreadParams()
        initDenimParams()
        initBaseColor()
        initColorFunc()
        
        background(BG)
        let composition = R.random_choice(compositions)
        // composition = withDivide
        await composition()
        print('done')

        // saveCanvas(`img ${i}`, 'jpg')
    // }
}