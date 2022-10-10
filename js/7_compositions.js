async function simple() {
    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    background(BG)
    await denim.draw()
    await denim.finishDraw()
}

async function patches() {
    const isMending = R.random() < .5

    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    const denimFringe = !isMending && R.random_dec() < 0.5

    const sumPatches = isMending || R.random_dec() < .3 ? 1 : R.random(3)
    const ptchs = []

    for (let i = 0; i < sumPatches; i++) {
        const patchCenter = isMending && R.random() < 0.5 ? v_rel(.5, .5) : v_rel(R.random(.2, .8), R.random(.2, .8))
        if (R.random_dec() < 0.5) ptchs.push(roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor))
        else ptchs.push(rectPatch(patchCenter, denimColor))
    }

    if (isMending) {
        const center = ptchs[0].denim.lp.center()
        stitches = []
        const mendingType = R.random_choice([1, 2, 3])
        let clr = patchStitchColor
        if (mendingType == 0) {
            let a = 0
            let r = 50
            const sumStitches = R.random(100, 200)
            for (let i = 0; i < sumStitches; i++) {
                const circum = 2 * PI * r
                const stitchLength = R.random(20, 30)
                a2 = a + stitchLength / circum * 360
                r2 = r + R.random(1, 2)
                stitches.push([vadd(center, v(r, 0).rotate(a)), vadd(center, v(r2, 0).rotate(a2))])
                a = a2 + R.random(8, 15)
                r = r2
            }
        } else {
            const bounds = ptchs[0].denim.lp.bounds()
            const xx = mendingType == 1 ? 15 : 0
            const threshold = R.random()
            const threshold2 = R.random()
            const colorType = R.random_choice([0,1,2])
            for (let x = bounds.left - 100; x < bounds.right + 100; x += R.random(30, 40)) {
                if (colorType == 1) clr = R.random_choice([color(255, 0, 0), color(0), color(255)])
                for (let y = bounds.top - R.random(100); y < bounds.bottom + R.random(100); y += R.random(30, 40)) {
                    if (colorType == 2) R.random_choice([color(255, 0, 0), color(0), color(255)])
                    const stitchLength = R.random(30, 40)

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
                            v(x - stitchLength / 2, y + stitchLength / 2 - xx),
                            v(x + stitchLength / 2, y + stitchLength / 2 + xx), clr])
                    y = y + stitchLength
                }
                x += R.random(30, 40)
            }
        }
        // stitches = stitches.filter(st => !(ptchs[0].denim.hasWeftOn(st[0]) && ptchs[0].denim.hasWeftOn(st[1])))
    }


    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    for (let i = 0; i < ptchs.length; i++) {
        denim.ripExtendMasks.push(ptchs[i].denim)
        applyPatch3dEffect(ptchs[i].denim, denim)
    }

    background(BG)
    await denim.draw({ dontFringe: denimFringe })

    for (let i = 0; i < ptchs.length; i++) {
        await ptchs[i].denim.draw({ dontFringe: ptchs.fringe })
        if (!isMending || (isMending && R.random() < 0.5)) await drawStitches(ptchs[i].stitches)
        await ptchs[i].denim.finishDraw()
    }

    if (isMending) {
        await drawStitches(stitches)
    }
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
    denim2.calc().makeRips()
    applyColorFunc(denim2, dyePattern1)
    denim2.dropShadowOn([denim])

    background(BG)
    await denim.draw({ dontFringe: true })
    await denim2.draw()
    await denim2.finishDraw()
}

async function withDivide() {
    dyePattern2 = getColorFunc()

    flipped = R.random() < 0.5
    withFringe = R.random() < 0.5
    pos1 = R.random_choice(['left', 'right', 'top', 'bottom'])
    pos2 = R.random() < 0.1 ? R.random_choice(['left', 'right', 'top', 'bottom']) : false
    if (!pos2 && R.random() < 0.5) {
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
        denim.ripExtendMasks.push(denim_top2)
    }

    applyColorFunc(denim_bg, dyePattern1)

    background(BG)
    await denim_bg.draw({ dontFringe: true })
    await denim_bg.finishDraw()
    await denim_top1.draw({ dontFringe: false })
    await denim_top1.finishDraw()
    if (pos2) {
        await denim_top2.draw({ dontFringe: false })
        await denim_top2.finishDraw()
    }
}





function divideTopDenim(pos) {
    let start, end
    if (['left', 'right'].includes(pos)) {
        start = v(-baseWidth * .2, baseHeight * R.random(.18, .82))
        end = v(baseWidth * 1.2, baseHeight * R.random(.18, .82))
    } else {
        start = v(baseWidth * R.random(.18, .82), -baseHeight * .2)
        end = v(baseWidth * R.random(.18, .82), baseHeight * 1.2)
    }

    const psum = R.random() < 0.75 ? R.random(2, 8) : 1
    const dir = vsub(end, start).div(psum)
    const mps = []
    for (let i = 1; i < psum + 1; i++) {
        const mp = vlerp(start, end, i / psum)
        mp.add(dir.copy().rotate(90).mult(R.random(-1, 1) / psum))
        mps.push(mp)
    }
    mps.push(end)
    mps.unshift(start)


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

    pattern_top = new LayoutPattern2(points).fillet(50)

    newDenim = new Denim(pattern_top, denimColor).rotate(R.random(-360))
    if (flipped) newDenim.visibleWhite = 1
    newDenim.age = 0.2
    newDenim.ripThreshold = R.random(.1, .45)
    newDenim.calc().makeRips()

    applyColorFunc(newDenim, dyePattern2)

    newDenim.dropShadowOn([denim_bg])

    if (withFringe) {
        newDenim.warpExtensions = [R.random(40, 100), R.random(100, 200)]
        newDenim.extendChance = R.random(.7, 1)
    } else newDenim.foldedStitchings()

    return newDenim
}