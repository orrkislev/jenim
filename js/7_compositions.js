async function patches() {
    const isMending = R.random() < .5
    print(isMending)

    denim = new Denim(fullPattern, denimColor).rotate(R.random(360))
    const denimFringe = !isMending && R.random_dec() < 0.5

    const sumPatches = isMending || R.random_dec() < .3 ? 1 : R.random(3)
    const ptchs = []

    for (let i = 0; i < sumPatches; i++) {
        const patchCenter = isMending && R.random()<0.5 ? v_rel(.5,.5) : v_rel(R.random(.2,.8), R.random(.2,.8))
        if (R.random_dec() < 0.5) ptchs.push(roundPatch(baseWidth * R.random(0.1, 0.25), patchCenter, denimColor))
        else ptchs.push(rectPatch(patchCenter,denimColor))
        if (i == 0) ptchs[i].fringe = true
    }

    if (isMending) {
        const center = ptchs[0].denim.lp.center()
        stitches = []
        const mendingType = R.random_choice([0, 1])
        print(mendingType)
        if (mendingType == 0) {
            const bounds = ptchs[0].denim.lp.bounds()
            for (let x = bounds.left - 100; x < bounds.right + 100; x += R.random(30, 40)) {
                for (let y = bounds.top - R.random(100); y < bounds.bottom + R.random(100); y += R.random(30, 40)) {
                    const stitchLength = R.random(30, 40)
                    stitches.push([v(x, y), v(x, y + stitchLength)])
                    stitches.push([v(x - stitchLength / 2, y + stitchLength / 2), v(x + stitchLength / 2, y + stitchLength / 2)])
                    y = y + stitchLength
                }
                x += R.random(30, 40)
            }
        } else if (mendingType == 1) {
            let a = 0
            let r = 35
            for (let i=0;i<200;i++){
                a2 = a + R.random(8, 15)
                r2 = r + R.random(1,2)
                stitches.push([vadd(center, v(r,0).rotate(a)), vadd(center, v(r2,0).rotate(a2))])
                a = a2 + R.random(8, 15)
                r = r2
            }
        }
        print(stitches.length)
    }


    denim.calc().makeRips()
    applyColorFunc(denim, dyePattern1)

    for (let i = 0; i < ptchs.length; i++) applyPatch3dEffect(ptchs[i].denim, denim)

    background(BG)
    await denim.draw({ dontFringe: denimFringe })

    for (let i = 0; i < ptchs.length; i++) {
        await ptchs[i].denim.draw({ dontFringe: ptchs.fringe })
        if (!isMending) await drawStitches(ptchs[i].stitches)
    }

    if (isMending) {
        await drawStitches(stitches)
    }
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
}

async function withDivide() {
    dyePattern2 = getColorFunc()

    const flipped = R.random() < 0.5
    const withFringe = R.random() < 0.5
    const isHorizontal = R.random() < 0.5

    denim_bg = new Denim(fullPattern, denimColor).rotate(R.random(360)).calc()


    let start, end
    if (isHorizontal) {
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
    if (isHorizontal) {
        if (R.random() < 0.5) {
            c1 = v(-baseWidth * .2, -baseHeight * .2)
            c2 = v(baseWidth * 1.2, -baseHeight * .2)
        } else {
            mps.reverse()
            c1 = v(baseWidth * 1.2, baseHeight * 1.2)
            c2 = v(-baseWidth * .2, baseHeight * 1.2)
        }
    } else {
        if (R.random() < 0.5) {
            mps.reverse()
            c1 = v(-baseWidth * .2, baseHeight * 1.2)
            c2 = v(-baseWidth * .2, -baseHeight * .2)
        } else {
            c1 = v(baseWidth * 1.2, -baseHeight * .2)
            c2 = v(baseWidth * 1.2, baseHeight * 1.2)
        }
    }

    const points = [c1, ...mps, c2]

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