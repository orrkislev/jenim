function roundPatch(size, position = v_rel(0.5, 0.5), color) {
    let ps = []
    ps = getEllipse(size * R.random(0.8, 1.2) * threadSize, size * R.random(0.8, 1.2) * threadSize, 45)
    ps.forEach(p => p.mult(R.random(.8, 2)))
    ps.forEach(p => p.add(position))
    ps = toCrv(ps)
    return makePatch(ps, color)
}

function rectPatch(position, color) {
    const w = R.random(100, 700)
    const h = R.random(100, 700)
    const rectPattern = new SquarePatternShape(position.x - w / 2, position.y - h / 2, w, h)
    rectPattern.fillet(R.random(50))
    rectPattern.rotate(R.random(-15, 15))
    ps = rectPattern.ps
    return makePatch(ps, color)
}

function makePatch(ps, color) {
    const pattern = new LayoutPattern2(ps)
    const denim = new Denim(pattern, color, 0).rotate(R.random(360)).calc()
    denim.warpExtensions = [5, 20]
    denim.extendChance = R.random(.2, .4)
    applyPatchShadow(denim)
    const stitches = patchStitches(denim).filter(_ => R.random_dec() > globalAge)
    const fringe = R.random_dec() < 0.3
    return { denim, stitches, fringe }
}

function applyPatchShadow(denim) {
    innerPattern = new LayoutPattern2(denim.lp.getOffset(-3 * globalScale))
    innerPattern.ps.forEach(p => p.add(5 * globalScale, 5 * globalScale))
    innerPattern.toCrv()

    const shading = createGraphics(width, height)
    shading.background(255)
    shading.noStroke()
    shading.fill(0)
    shading.beginShape()
    innerPattern.crv().forEach(p => shading.vertex(p.x, p.y))
    shading.endShape()
    shading.filter(BLUR, 10 * globalScale)

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

function applyPatch3dEffect(patch, denim) {
    innerPattern = new LayoutPattern2(patch.lp.getOffset(0))
    innerPattern.ps.forEach(p => p.add(5, 5))
    innerPattern.toCrv()

    const shading = createGraphics(width, height)
    shading.background(0)
    shading.noStroke()
    shading.fill(255, 20)
    innerPattern.crv().forEach(p => shading.circle(p.x, p.y, R.random(50)))
    innerPattern.crv().forEach(p => shading.circle(p.x, p.y, R.random(30)))
    innerPattern.crv().forEach(p => shading.circle(p.x, p.y, R.random(10)))

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

function patchStitches(patch, stitchType) {
    threadSize = initialThreadSize
    let stitches = []
    const r = stitchType || R.random_choice([1, 2, 3])
    if (r == 1) {
        stitches = crossStitches(patch.lp)
    } else if (r == 2) {
        stitches = patch.lp.stitches(6, 5, 5, true)
        if (R.random_dec() < 0.5)
            stitches = stitches.concat(patch.lp.stitches(7, 5, 5, true))
        if (R.random_dec() < 0.4)
            for (let i = 1; i < R.random(3); i++) {
                stitches = stitches.concat(patch.lp.stitches(6 + R.random(5, 40), 5, 5, true))
            }
    } else if (r == 3) {
        stitches = patch.lp.stitches(-6, 5, 5, true)
        if (R.random_dec() < 0.5)
            stitches = stitches.concat(patch.lp.stitches(-7, 5, 5, true))
        if (R.random_dec() < .7) {
            stitches = stitches.concat(patch.lp.stitches(-3, 5, 5, true))
        }
    }
    return stitches
}

async function drawStitches(stitches) {
    for (const s of stitches) {
        const ps = s.slice(0, 2)
        const dir = vsub(ps[1], ps[0]).rotate(-90).setMag(5 * globalScale)
        const crv = toCrv(ps).map(p => p.mult(globalScale))
        for (const p of crv) await burn(vsub(p, dir), 12 * globalScale, 4)
        for (const p of crv) await dodge(vadd(p, dir), 12 * globalScale, 4)
        await new Loop(s.slice(0, 2), s[2] ? s[2] : patchStitchColor, initialThreadSize * 1.3).wiggle().shadow().draw()
        await timeout(0);
    }
}

function crossStitches(pattern) {
    let stitches = pattern.stitches(1, R.random(5, 15), R.random(5, 10), true).map(st => {
        const numStitches = round(R.random(1, 2))
        const l = vdist(st[0], st[1])
        const dir = vsub(st[1], st[0])
        const perp = dir.copy().rotate(90)
        const newStitches = []
        for (let i = 1; i < l; i += l / numStitches) {
            const p0 = vsub(st[0], perp.setMag(10))
            const p1 = vadd(p0, dir.setMag(i + .5))
            const p2 = vadd(p1, perp.setMag(30))
            newStitches.push([p1, p2])
        }
        return newStitches
    }).flat()
    return stitches
}async function simple() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim.calc().makeRips()

    background(BG)
    await denim.draw({ colorFunc: dyePattern1 })
    await denim.finishDraw()
}

async function patches() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim.ripThreshold = .1
    denim.calc().makeRips()
    background(BG)
    await denim.draw({ colorFunc: dyePattern1 })

    R.reset(100)

    const sumPatches = R.random_dec() < .3 ? 1 : R.random(3)
    const ptchs = []

    for (let i = 0; i < sumPatches; i++) {
        const patchCenter = R.random() < 0.5 ? v_rel(.5, .5) : v_rel(R.random(.2, .8), R.random(.2, .8))
        if (R.random_dec() < 0.5) ptchs.push(roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor))
        else ptchs.push(rectPatch(patchCenter, denimColor))
    }

    for (let i = 0; i < ptchs.length; i++) {
        denim.ripExtendMasks.push(ptchs[i].denim)
        // applyPatch3dEffect(ptchs[i].denim, denim)
    }


    threadSize = initialThreadSize * 1.5
    for (let i = 0; i < ptchs.length; i++) {
        await ptchs[i].denim.draw({ dontFringe: 1 - ptchs[i].fringe })
        await drawStitches(ptchs[i].stitches)
        await ptchs[i].denim.finishDraw()
    }

    await denim.finishDraw()
}

async function singleHole() {
    denim_bg = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim_bg.visibleWhite = 1
    denim_bg.darkness = .7
    denim_bg.calc()
    background(BG)
    await denim_bg.draw({ dontFringe: true })
    R.reset(100)

    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    const distMultiplier = R.random(2, 4) - globalAge * 3
    denim.pointInRip = (p) => {
        const d = distMultiplier * p.dist(v_rel(.5, .5)) / baseHeight
        return noise(ripNoiseScale[0] * p.x / baseWidth, ripNoiseScale[1] * p.y / baseHeight, denim.ripNoiseZ) > d
    }

    if (R.random() < 0.5) {
        denim.ripMin = 0
        denim.ripMax = 0
    }
    denim.calc().makeRips()

    R.reset(100)

    const lScale = R.random(5)
    denim.warpRips.forEach(r => r.len *= R.random(.2) * lScale)
    await denim.draw({ colorFunc: dyePattern1 })
    await denim.finishDraw()

    R.reset(100)

    if (R.random() < 0.3) {
        const crv = findCurve(denim.weftRips.map(r => r.pos))
        const lines = []
        for (let i = 0; i < crv.length - 1; i++) {
            const p1 = crv[i]
            const p2 = crv[i + 1]
            const dir = vsub(p2, p1).rotate(-90).setMag(R.random(20, 150))
            const mid = vadd(p1, p2).mult(.5).add(dir)
            lines.push([p1, mid])
            lines.push([mid, p2])
        }
        let stitches = []
        for (let i = 0; i < lines.length; i++) {
            const p1 = lines[i][0]
            const p2 = lines[i][1]
            const l = vdist(p1, p2)
            const dir = vsub(p2, p1)
            for (let j = 0; j < l; j += 25) {
                const p_1 = vadd(p1, dir.copy().setMag(j))
                const p_2 = vadd(p1, dir.copy().setMag(j + 15))
                stitches.push([p_1, p_2, color(0)])
            }
        }
        stitches = filter(_ => R.random_dec() > globalAge)
        await drawStitches(stitches)
    }
}

function findCurve(points) {
    const center = v_rel(.5, .5)
    const crvPoints = []
    for (let angle = 0; angle < 360; angle += 10) {
        const nextP = points.reduce((a, b) => abs(getAngle(a, center) - angle) < abs(getAngle(b, center) - angle) ? a : b)
        crvPoints.push(nextP)
    }
    crvPoints.push(crvPoints[0])
    return crvPoints
}

function getAngle(p1, p2) {
    return (vsub(p1, p2).heading() + 360) % 360
}


async function mending() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    const drawDenimFringes = R.random() < .5

    let ptch
    const patchCenter = R.random() < 0.5 ? v_rel(.5, .5) : v_rel(R.random(.2, .8), R.random(.2, .8))
    if (R.random_dec() < 0.5) ptch = roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor)
    else ptch = rectPatch(patchCenter, denimColor)
    ptch.stitches = patchStitches(ptch.denim, 3)
    const drawPatchStitches = R.random() < 0.3

    stitches = []
    const mendingType = R.random_choice([1, 2, 3])
    let clr = R.random_choice([color(255, 0, 0), color(0), color(255)])

    const bounds = ptch.denim.lp.bounds()
    const xx = mendingType == 1 ? 15 : 0
    const threshold = R.random()
    const threshold2 = R.random()
    const colorType = R.random() < .8 ? 0 : (R.random() < .8 ? 1 : 2)
    for (let x = bounds.left - 100; x < bounds.right + 100; x += R.random(20, 30)) {
        if (colorType == 1) clr = R.random_choice([color(255, 0, 0), color(0), color(255)])
        for (let y = bounds.top - R.random(100); y < bounds.bottom + R.random(100); y += R.random(20, 30)) {
            if (colorType == 2) clr = R.random_choice([color(255, 0, 0), color(0), color(255)])
            const stitchLength = R.random(20, 30)

            let draw1 = true
            let draw2 = true
            if (R.random() < threshold) {
                if (R.random() < threshold2) draw1 = false
                else draw2 = false
            }

            if (R.random() > globalAge) {
                if (draw1)
                    stitches.push([
                        v(x + xx, y),
                        v(x - xx, y + stitchLength), clr])
                if (draw2)
                    stitches.push([
                        v(x + stitchLength / 2, y + stitchLength / 2 + xx),
                        v(x - stitchLength / 2, y + stitchLength / 2 - xx), clr])
            }
            y = y + stitchLength
        }
        x += R.random(30, 40)
    }
    stitches = stitches.filter(_ => R.random_dec() > globalAge)

    denim.ripThreshold = R.random(.1)
    denim.calc().makeRips()

    stitches = stitches.filter(s =>
        (denim.hasWeftOn(s[0]) && denim.hasWeftOn(s[1])) ||
        (ptch.denim.hasWeftOn(s[0]) && ptch.denim.hasWeftOn(s[1])))

    denim.ripExtendMasks.push(ptch.denim)
    applyPatch3dEffect(ptch.denim, denim)

    background(BG)
    await denim.draw({ dontFringe: !drawDenimFringes, colorFunc: dyePattern1 })

    threadSize = initialThreadSize * 1.5
    await ptch.denim.draw({ dontFringe: ptch.fringe })
    if (drawPatchStitches) await drawStitches(ptch.stitches)
    await ptch.denim.finishDraw()

    // print(stitches.length)
    await drawStitches(stitches)
    await denim.finishDraw()
}

async function largeRips() {
    denim = new Denim(fullPattern, neighborColor(denimColor, 0, 0, -150)).rotate(R.random(360))
    denim.visibleWhite = 1
    denim.darkness = .3
    denim.calc()

    denim2 = new Denim(fullPattern, denimColor).rotate(R.random(360))
    ripNoiseScale = [R.random(4, 8), R.random(4, 8)]
    denim2.ripThreshold = R.random(.3, .5)
    denim2.ripMax *= R.random(2)
    denim2.calc().makeRips()
    denim2.dropShadowOn([denim])

    background(BG)
    await denim.draw({ dontFringe: true })
    await denim2.draw({ colorFunc: dyePattern1 })
    await denim2.finishDraw()
}

let withFringe = false
async function fringeComp() {
    withFringe = true
    await withDivide()
}

async function withDivide() {
    const withSmallFringe = withFringe ? true : R.random() < .5
    flipped = R.random() < 0.5
    pos1 = R.random_choice(['left', 'right', 'top', 'bottom'])
    pos2 = R.random() < 0.15 ? R.random_choice(['left', 'right', 'top', 'bottom']) : false
    if (pos2 && R.random() < 0.5) {
        if (pos1 == 'left') pos2 = 'right'
        else if (pos1 == 'right') pos2 = 'left'
        else if (pos1 == 'top') pos2 = 'bottom'
        else if (pos1 == 'bottom') pos2 = 'top'
    }

    denim_bg = new Denim(fullPattern, denimColor).rotate(R.random(360)).calc()
    denim_top1 = divideTopDenim(pos1)
    denim_bg.ripExtendMasks.push(denim_top1)
    if (pos2) {
        denim_top2 = divideTopDenim(pos2)
        denim_top1.ripExtendMasks.push(denim_top2)
        denim_bg.ripExtendMasks.push(denim_top2)
    }

    background(BG)
    await denim_bg.draw({ dontFringe: true, colorFunc: dyePattern1 })
    await denim_bg.finishDraw()
    await denim_top1.draw({ dontFringe: !withSmallFringe })
    await denim_top1.finishDraw()
    if (pos2) {
        await denim_top2.draw({ dontFringe: !withSmallFringe, colorFunc: dyePattern2 })
        await denim_top2.finishDraw()
    }
}





function divideTopDenim(pos) {
    let start, end
    if (['left', 'right'].includes(pos)) {
        start = v(-baseWidth * .2, baseHeight * R.random(.25, .75))
        end = v(baseWidth * 1.2, baseHeight * R.random(.25, .75))
    } else {
        start = v(baseWidth * R.random(.25, .75), -baseHeight * .2)
        end = v(baseWidth * R.random(.25, .75), baseHeight * 1.2)
    }

    // const psum = R.random() < 0.75 ? 1 : 2
    // const dir = vsub(end, start).div(psum)
    const mps = [start, end]
    // for (let i = 1; i < psum + 1; i++) {
    //     const mp = vlerp(start, end, i / psum)
    //     mp.add(dir.copy().rotate(90).mult(R.random(-1, 1) / psum))
    //     mps.push(mp)
    // }
    // mps.push(end)
    // mps.unshift(start)


    let c1, c2
    if (pos == 'left') {
        c1 = v(-baseWidth * .2, -baseHeight * .2)
        c2 = v(baseWidth * 1.2, -baseHeight * .2)
    } else if (pos == 'right') {
        mps.reverse()
        c1 = v(baseWidth * 1.2, baseHeight * 1.2)
        c2 = v(-baseWidth * .2, baseHeight * 1.2)
    } else if (pos == 'top') {
        mps.reverse()
        c1 = v(-baseWidth * .2, baseHeight * 1.2)
        c2 = v(-baseWidth * .2, -baseHeight * .2)
    } else {
        c1 = v(baseWidth * 1.2, -baseHeight * .2)
        c2 = v(baseWidth * 1.2, baseHeight * 1.2)
    }

    const points = [c1, ...mps, c2]

    pattern_top = new LayoutPattern2(points).fillet(80)

    newDenim = new Denim(pattern_top, denimColor).rotate(R.random(-360))
    if (flipped) newDenim.visibleWhite = 1
    newDenim.age = 0.2
    newDenim.ripThreshold = R.random(.1, .45)
    if (!withFringe) newDenim.lp.prepareFoldedStitchings()
    newDenim.calc().makeRips()

    newDenim.dropShadowOn([denim_bg])

    if (withFringe) {
        newDenim.warpExtensions = [R.random(120, 250), R.random(250, 540)]
        newDenim.extendChance = R.random(.7, 1)
    } else newDenim.foldedStitchings()

    return newDenim
}/// <reference path="../p5.global-mode.d.ts" />

const warpColors = natural
let stitchColor

const BG = '#666'
const baseWidth = 1000
const baseHeight = baseWidth * (7 / 5)
let globalScale;


function initFeatures() {
    composition = R.random_choice([withDivide, patches, largeRips, simple, mending, singleHole, fringeComp])
    // composition = mending
    // print(composition)
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