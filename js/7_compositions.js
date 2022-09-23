const compositions = [withDivide, patches, largeRips]

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