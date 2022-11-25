async function simple() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    background(BG)
    await denim.draw()
    await denim.finishDraw()
}

async function patches() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim.ripThreshold = .1
    const sumPatches = R.random_dec() < .3 ? 1 : R.random(3)
    const ptchs = []

    for (let i = 0; i < sumPatches; i++) {
        const patchCenter = R.random() < 0.5 ? v_rel(.5, .5) : v_rel(R.random(.2, .8), R.random(.2, .8))
        if (R.random_dec() < 0.5) ptchs.push(roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor))
        else ptchs.push(rectPatch(patchCenter, denimColor))
    }

    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    for (let i = 0; i < ptchs.length; i++) {
        denim.ripExtendMasks.push(ptchs[i].denim)
        applyPatch3dEffect(ptchs[i].denim, denim)
    }

    background(BG)
    await denim.draw()

    threadSize = initialThreadSize * 1.5
    for (let i = 0; i < ptchs.length; i++) {
        await ptchs[i].denim.draw({ dontFringe: 1-ptchs[i].fringe })
        await drawStitches(ptchs[i].stitches)
        await ptchs[i].denim.finishDraw()
    }

    await denim.finishDraw()
}

async function singleHole() {
    denim_bg = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim_bg.visibleWhite = 1
    denim_bg.darkness = .7

    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    const distMultiplier = R.random(2, 4)
    denim.pointInRip = (p) => {
        const d = distMultiplier * p.dist(v_rel(.5, .5)) / baseHeight
        return noise(ripNoiseScale[0] * p.x / baseWidth, ripNoiseScale[1] * p.y / baseHeight, denim.ripNoiseZ) > d
    }

    if (R.random() < 0.5) {
        denim.ripMin = 0
        denim.ripMax = 0
    }
    denim.calc().makeRips()
    denim_bg.calc()



    applyColorFunc(denim, dyePattern1)

    const lScale = R.random(5)
    denim.warpRips.forEach(r => r.len *= R.random(.2) * lScale)

    background(BG)
    await denim_bg.draw({ dontFringe: true })
    await denim.draw()
    await denim.finishDraw()

    if (R.random() < .3) {
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
        const stitches = []
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

    let ptch
    const patchCenter = R.random() < 0.5 ? v_rel(.5, .5) : v_rel(R.random(.2, .8), R.random(.2, .8))
    if (R.random_dec() < 0.5) ptch = roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor)
    else ptch = rectPatch(patchCenter, denimColor)
    ptch.stitches = patchStitches(ptch.denim, 3)

    stitches = []
    const mendingType = R.random_choice([1, 2, 3])
    let clr = R.random_choice([color(255, 0, 0), color(0), color(255)])

    const bounds = ptch.denim.lp.bounds()
    const xx = mendingType == 1 ? 15 : 0
    const threshold = R.random()
    const threshold2 = R.random()
    const colorType = R.random()<.8 ? 0 : (R.random()<.8 ? 1 : 2)
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

            if (draw1)
                stitches.push([
                    v(x + xx, y),
                    v(x - xx, y + stitchLength), clr])
            if (draw2)
                stitches.push([
                    v(x + stitchLength / 2, y + stitchLength / 2 + xx),
                    v(x - stitchLength / 2, y + stitchLength / 2 - xx), clr])
            y = y + stitchLength
        }
        x += R.random(30, 40)
    }
    denim.ripThreshold = R.random(.1)
    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    stitches = stitches.filter(s =>
        (denim.hasWeftOn(s[0]) && denim.hasWeftOn(s[1])) ||
        (ptch.denim.hasWeftOn(s[0]) && ptch.denim.hasWeftOn(s[1])))

    denim.ripExtendMasks.push(ptch.denim)
    applyPatch3dEffect(ptch.denim, denim)

    background(BG)
    await denim.draw({ dontFringe: R.random() < .5 })

    threadSize = initialThreadSize * 1.5
    await ptch.denim.draw({ dontFringe: ptch.fringe })
    if (R.random() < 0.3) await drawStitches(ptch.stitches)
    await ptch.denim.finishDraw()

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
    applyColorFunc(denim2, dyePattern1)
    denim2.dropShadowOn([denim])

    background(BG)
    await denim.draw({ dontFringe: true })
    await denim2.draw()
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

    applyColorFunc(denim_bg, dyePattern1)

    background(BG)
    await denim_bg.draw({ dontFringe: true })
    await denim_bg.finishDraw()
    await denim_top1.draw({ dontFringe: !withSmallFringe })
    await denim_top1.finishDraw()
    if (pos2) {
        await denim_top2.draw({ dontFringe: !withSmallFringe })
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
    newDenim.calc().makeRips()

    applyColorFunc(newDenim, dyePattern2)

    newDenim.dropShadowOn([denim_bg])

    if (withFringe) {
        newDenim.warpExtensions = [R.random(120, 250), R.random(250, 540)]
        newDenim.extendChance = R.random(.7, 1)
    } else newDenim.foldedStitchings()

    return newDenim
}