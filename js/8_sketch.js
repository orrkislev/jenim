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


    composition = R.random_choice([withDivide, patches, largeRips, simple, mending, singleHole, fringeComp])
    composition = fringeComp
    print(composition.name)
    initBaseColor()
    dyePattern1 = getColorFunc()
    dyePattern2 = R.random() < 0.5 ? dyePattern1 : getColorFunc()

    makeImage()
}

async function makeImage() {
    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    ripNoiseScale = [R.random(5, 10), R.random(5, 10)]
    initialThreadSize = R.random(1.3, 2)
    threadSize = initialThreadSize

    const d = new Date()
    const fullYears = d.getFullYear() - 2023
    const years = fullYears + d.getMonth() / 12
    globalAge = constrain(years / 10, 0, 1)

    fullPattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)


    background(BG)
    fill(255)
    textSize(10)
    textAlign(CENTER, CENTER)
    text('Loading Jenim', width / 2, height / 2)
    noFill()
    await timeout(30)

    await composition()

    print('done')

    // save('jenim' + tokenData.hash + '.png')
    // setTimeout(() => location.reload() , 200)
}