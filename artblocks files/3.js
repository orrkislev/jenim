function roundPatch(size, position = v_rel(0.5, 0.5), color) {
    let ps = []
    ps = getEllipse(size * R.random(0.8, 1.2) * threadSize, size * R.random(0.8, 1.2) * threadSize, 45)
    ps.forEach(p => p.mult(R.random(.8, 2)))
    ps.forEach(p => p.add(position))
    ps = makeCurve(ps)
    return makePatch(ps, color)
}

function rectPatch(color) {
    const rectPattern = new SquarePatternShape(R.random(baseWidth), R.random(baseWidth), R.random(100, 600), R.random(100, 600))
    rectPattern.rotate(R.random(-15, 15))
    ps = rectPattern.ps
    return makePatch(ps, color)
}

function makePatch(ps, color) {
    const pattern = new LayoutPattern2(ps)
    const denim = new Denim(pattern, color, 0).rotate(R.random(360)).calc()
    applyPatchShadow(denim)
    const stitches = patchStitches(denim)
    const fringe = R.random_dec() < 0.5
    return {denim,stitches,fringe}
}

function applyPatchShadow(denim) {
    innerPattern = new LayoutPattern2(denim.layoutPattern.getOffset(-3 * globalScale))
    innerPattern.ps.forEach(p => p.add(5 * globalScale, 5 * globalScale))
    innerPattern.makeCurve()

    const shading = createGraphics(width, height)
    shading.background(255)
    shading.noStroke()
    shading.fill(0)
    shading.beginShape()
    innerPattern.getCurve().forEach(p => shading.vertex(p.x,p.y))
    shading.endShape()
    shading.filter(BLUR,10 * globalScale)

    denim.weft.forEach(col => {
        col.forEach(loop => {
            if (loop.ps.length > 0) {
                const p = loop.ps[0]
                const c = shading.get(p.x, p.y)
                if (brightness(c) < 360)
                    loop.darkness = brightness(c) / 1500
            }
        })
    })
}

function applyPatch3dEffect(patch,denim) {
    innerPattern = new LayoutPattern2(patch.layoutPattern.getOffset(0))
    innerPattern.ps.forEach(p => p.add(5, 5))
    innerPattern.makeCurve()

    const shading = createGraphics(width, height)
    shading.background(0)
    shading.noStroke()
    shading.fill(255,20)
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,R.random(50)))
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,R.random(30)))
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,R.random(10)))

    denim.weft.forEach(col => {
        col.forEach(loop => {
            if (loop.ps.length > 0) {
                const p = loop.ps[0]
                const c = shading.get(p.x, p.y)
                if (brightness(c) < 360)
                    loop.age = brightness(c) / 1500
            }
        })
    })
}

function patchStitches(patch) {
    threadSize = initialThreadSize
    let stitches = []
    const r = R.random_choice([1,2,3])
    if (r == 1) {
        stitches = crossStitches(patch.layoutPattern, R.random(2,8), [35,3,3,3])
    } else if (r == 2) {
        stitches = patch.layoutPattern.stitches(6, 5, 5,true)
        if (R.random_dec()<0.5)
            stitches = stitches.concat(patch.layoutPattern.stitches(7, 5, 5,true))
        if (R.random_dec()<0.4)
            for (let i=1;i<R.random(3);i++){
                stitches = stitches.concat(patch.layoutPattern.stitches(6+R.random(5,40), 5, 5,true))
            }
    } else if (r == 3) {
        stitches = patch.layoutPattern.stitches(-6, 5, 5,true)
        if (R.random_dec()<0.5)
            stitches = stitches.concat(patch.layoutPattern.stitches(-7, 5, 5,true))
        if (R.random_dec()<.7){
            stitches = stitches.concat(patch.layoutPattern.stitches(-3, 5, 5,true))
        }
    }
    return stitches
}

async function drawStitches(stitches){
    for (const s of stitches){
        await new Loop(s, patchStitchColor, initialThreadSize * 1.4).wiggle().shadow().draw()
        await timeout(0);
    }
}

function crossStitches(pattern, h, stitchPattern) {
    let crv = [...pattern.ps]
    crv.push(pattern.ps[0])
    crv = makeCurve(crv)
    const newPs = []
    for (let i=0;i<crv.length;i+=stitchPattern.rotate()) newPs.push(crv[i])
    pattern.ps = newPs
    const offset1 = pattern.getOffset(h)
    const offset2 = pattern.getOffset(-h)
    const stitches = []
    for (let i = 0; i < offset1.length; i++) {
        offset1[i].add(R.random(-2, 2), R.random(-2, 2))
        offset2[i].add(R.random(-2, 2), R.random(-2, 2))
        stitches.push([offset1[i], offset2[i]])
    }
    return stitches
}

async function patches() {
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim = new Denim(pattern, denimColor).rotate(R.random(360))
    const denimFringe = R.random_dec() < 0.5

    const sumPatches = R.random_dec() < .8 ? 1 : R.random(3)
    const ptchs = []

    for (let i=0;i<sumPatches;i++){
        if (R.random_dec() < 0.5) ptchs.push(roundPatch(baseWidth * R.random(0.1, 0.25), v_rel(R.random(.2, .8), R.random(.2, .8)), denimColor))
        // if (R.random_dec() < 0.5) ptchs.push(roundPatch(R.random(30, 250), v_rel(R.random(.2, .8), R.random(.2, .8)), denimColor))
        else ptchs.push(rectPatch(denimColor))
        if (i==0) ptchs[i].fringe = true
    }

    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    for (let i=0;i<ptchs.length;i++) applyPatch3dEffect(ptchs[i].denim, denim)

    background(BG)
    await denim.draw({ dontFringe: denimFringe })

    for (let i = 0; i < ptchs.length; i++) {
        await ptchs[i].denim.draw({ dontFringe: ptchs.fringe })
        await drawStitches(ptchs[i].stitches)
    }
}

async function largeRips() {
    print('composition - large rips')
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim = new Denim(pattern, neighborColor(denimColor, 0, 0, -150)).rotate(R.random(360))
    denim.visibleWhite = 1
    denim.darkness = .3
    denim.calc()

    denim2 = new Denim(pattern, denimColor).rotate(R.random(360))
    ripNoiseScale = [R.random(4, 8), R.random(4, 8)]
    denim2.ripThreshold = R.random(.3, .5)
    denim2.calc().makeRips()
    applyColorFunc(denim2, dyePattern1)
    denim2.dropShadowOn([denim])

    background(BG)
    await denim.draw({ dontFringe: true })
    await denim2.draw()
}

async function withDivide() {
    dyePattern2 = getColorFunc()
    
    const flipped = R.random() < 0.5
    const withFringe = R.random() < 0.5
    const isHorizontal = R.random() < 0.5

    pattern_bg = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim_bg = new Denim(pattern_bg, denimColor).rotate(R.random(360)).calc()


    let start, end
    if (isHorizontal) {
        start = v(-baseWidth * .2, baseHeight * R.random(.3, .7))
        end = v(baseWidth * 1.2, baseHeight * R.random(.3, .7))
    } else {
        start = v(baseWidth * R.random(.3, .7), -baseHeight * .2)
        end = v(baseWidth * R.random(.3, .7), baseHeight * 1.2)
    }

    const middlePointsSum = R.random() < 0.5 ? R.random(2, 5) : 1
    const dir = p5.Vector.sub(end, start).div(middlePointsSum)
    const middlePoints = []
    for (let i = 1; i < middlePointsSum + 1; i++) {
        const middlePoint = p5.Vector.lerp(start, end, i / middlePointsSum)
        middlePoint.add(dir.copy().rotate(90).mult(R.random(-.2, .2)))
        middlePoints.push(middlePoint)
    }
    middlePoints.push(end)
    middlePoints.unshift(start)

    let corner1, corner2
    if (isHorizontal) {
        if (R.random() < 0.5) {
            corner1 = v(-baseWidth * .2, -baseHeight * .2)
            corner2 = v(baseWidth * 1.2, -baseHeight * .2)
        } else {
            middlePoints.reverse()
            corner1 = v(baseWidth * 1.2, baseHeight * 1.2)
            corner2 = v(-baseWidth * .2, baseHeight * 1.2)
        }
    } else {
        if (R.random() < 0.5) {
            middlePoints.reverse()
            corner1 = v(-baseWidth * .2, baseHeight * 1.2)
            corner2 = v(-baseWidth * .2, -baseHeight * .2)
        } else {
            corner1 = v(baseWidth * 1.2, -baseHeight * .2)
            corner2 = v(baseWidth * 1.2, baseHeight * 1.2)
        }
    }

    const points = [corner1, ...middlePoints, corner2]

    pattern_top = new LayoutPattern2(points).fillet(50)

    denim_top = new Denim(pattern_top, denimColor).rotate(R.random(-360))
    if (flipped) denim_top.visibleWhite = 1
    denim_top.age = 0.2
    denim_top.ripThreshold = R.random(.1, .45)
    denim_top.calc().makeRips()

    applyColorFunc(denim_bg, dyePattern1)
    applyColorFunc(denim_top, dyePattern2)

    denim_top.foldedStitchings()
    denim_top.dropShadowOn([denim_bg])

    if (withFringe) {
        denim_top.warpExtensions = [R.random(10, 50), R.random(50, 200)]
        denim_top.extendChance = R.random(.7, 1)
    }

    background(BG)
    await denim_bg.draw({ dontFringe: true })
    await denim_top.draw({ dontFringe: false })
}

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

    composition = R.random_choice([withDivide, patches, largeRips])
    dyePattern1 = getColorFunc()

    print(composition.name)
    // composition = withDivide
    await composition()
    print('done')
}