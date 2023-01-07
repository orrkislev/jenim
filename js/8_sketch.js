/// <reference path="../p5.global-mode.d.ts" />

const warpColors = natural
let stitchColor

const BG = '#666'
const baseWidth = 1000
const baseHeight = baseWidth * (7 / 5)
let globalScale;


function initFeatures() {
    composition = R.random_choice([withDivide, patches, largeRips, simple, mending, singleHole, fringeComp])
    // composition = mending
    print(composition)
    getBaseColor()
    dyePattern1 = getColorFunc()
    dyePattern2 = R.random() < 0.5 ? dyePattern1 : getColorFunc()
}




function setup() {
    initFeatures()

    noiseSeed(R.random_int(20000))

    if (windowWidth * (7 / 5) > windowHeight) canvas = createCanvas(windowHeight / (7 / 5), windowHeight);
    else canvas = createCanvas(windowWidth, windowWidth * (7 / 5))
    globalScale = width / baseWidth

    initialThreadSize = R.random(1.3, 2)
    threadSize = initialThreadSize

    dyePattern1 = initColorFunc(dyePattern1)
    dyePattern2 = initColorFunc(dyePattern2)
    initBaseColor()

    ripNoiseScale = [R.random(5, 10), R.random(5, 10)]

    angleMode(DEGREES)
    noLoop()
    noStroke()
    noFill()

    const d = new Date()
    const fullYears = d.getFullYear() - 2023
    const years = fullYears + d.getMonth() / 12
    globalAge = constrain(years / 10, 0, 1)

    fullPattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)

    makeImage()
}

async function makeImage() {
    background(BG)
    fill(255)
    textSize(10)
    textAlign(CENTER, CENTER)
    text('Loading Jenim', width / 2, height / 2)
    noFill()
    await timeout(30)

    await composition()
    print('done')

    // save(`jenim ${tokenData.hash.slice(0, 3)} ${extraAge}.png`)
    // setTimeout(() => {
    //     window.location.href = `?age=${extraAge + 5}`
    // }, 200)
}