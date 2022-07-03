const compositions = [hem, twohalfs, withPocket, patches, largeRips, withFringe]

async function hem() {
    print('composition - hem')
    const hemPos = R.random(.2, .9)
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight * hemPos)
    pattern2 = new SquarePatternShape(-100, baseHeight * hemPos, baseWidth + 200, baseHeight * (1 - hemPos) + 100)

    denim = new Denim(pattern, denimColor).calc().makeRips()
    denim2 = new Denim(pattern2, denimColor).rotate(180)
    denim2.visibleWhite = 1
    denim2.age = 0.2
    denim2.calc()

    applyColorFunc(denim, globalColorFunc)
    applyColorFunc(denim2, globalColorFunc)

    denim2.dropShadowOn([denim])
    denim2.foldedStitchings()

    await denim.draw()
    await denim2.draw()
}

async function twohalfs() {
    print('composition - two halfs')
    pattern_l = new SquarePatternShape(baseWidth / 2 - baseHeight, -baseHeight*0.15, baseHeight, baseHeight*1.3)
    pattern_r = new SquarePatternShape(baseWidth / 2, -baseHeight*0.15, baseHeight, baseHeight*1.3)
    const r = R.random(-30, 30)
    pattern_r.rotateAround(v_rel(0.5, 0.5), r)
    pattern_l.rotateAround(v_rel(0.5, 0.5), r)

    denim_r = new Denim(pattern_r, denimColor).rotate(-10).calc().makeRips()
    denim_r.age = 1.5
    denim_l = new Denim(pattern_l, denimColor).rotate(10).calc().makeRips()
    denim_l.age = 1.5

    applyColorFunc(denim_r, globalColorFunc)
    applyColorFunc(denim_l, globalColorFunc)

    denim_l.foldedStitchings()
    denim_l.dropShadowOn([denim_r])

    await denim_r.draw({ dontFringe: true })
    await denim_l.draw({ dontFringe: true })
}


async function withPocket() {
    print('composition - pocket')
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    pocketPattern = new LayoutPattern2([v(0, 0), v(240, 1000), v(680, 1140), v(1160, 940), v(1320, 0)]).fillet(24)
    const pocketCenter = pocketPattern.center()
    pocketPattern.ps.forEach(p => p.sub(pocketCenter))
    const x = R.random(baseWidth)
    const y = R.random(baseHeight - pocketCenter.y)
    pocketPattern.ps.forEach(p => p.add(x, y))

    rotation = R.random(-60,60)
    pocketPattern.rotate(rotation)

    denim = new Denim(pattern, denimColor).rotate(rotation - 10).calc()
    pocket = new Denim(pocketPattern, denimColor).rotate(R.random(-60, 60))
    pocket.age = 0.2
    pocket.ripThreshold = R.random(.18, .45)
    pocket.calc().makeRips()

    applyColorFunc(denim, globalColorFunc)
    applyColorFunc(pocket, globalColorFunc)

    pocket.foldedStitchings()
    pocket.dropShadowOn([denim])

    await denim.draw({ dontFringe: true })
    await pocket.draw({ dontFringe: R.random_dec() < 0.5 })
}

async function patches() {
    print('composition - patches')
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim = new Denim(pattern, denimColor).rotate(R.random(360)).calc().makeRips()
    applyColorFunc(denim, globalColorFunc)

    patch = roundPatch(baseWidth * R.random(0.03, 0.25), v_rel(R.random(.2, .8), R.random(.2, .8)), denimColor)
    if (R.random_dec() < 0.3) patch = rectPatch(denimColor)
    applyPatchShadow(patch)
    applyPatch3dEffect(patch, denim)

    await denim.draw({ dontFringe: R.random_dec() < 0.5, withBehind: true })
    await patch.draw({ dontFringe: R.random_dec() < 0.5 })
    await patchStitches(patch)

    if (R.random_dec() < .2) {
        for (let i = 0; i < R.random(3); i++) {
            patch = roundPatch(R.random(30, 250), v_rel(R.random(.2, .8), R.random(.2, .8)), denimColor)
            if (R.random_dec() < 0.5) patch = rectPatch(denimColor)
            applyPatchShadow(patch)
            await patch.draw({ dontFringe: R.random_dec() < 0.5 })
            await patchStitches(patch)
        }
    }


    // embColor = color(0)
    // const r = height * 0.25
    // for (let i = 0; i < r; i+=3) {
    //     const w = sqrt(r ** 2 - (r - i) ** 2)
    //     const p1 = v(width / 2 - w / 2, height*0.25 + i)
    //     const p2 = v(width / 2 + w / 2, height*0.25 + i)
    //     if (denim.hasWeftOn(p1) && denim.hasWeftOn(p2))
    //         await new Loop([p1, p2], embColor).wiggle().shadow().draw()
    // }

    // return

    // for (let x = width * 0.2; x < width * 0.8; x += 30) {
    //     for (let y = height * 0.2; y < height * 0.8; y += 30) {
    //         const p1 = v(x - 10, y)
    //         const p2 = v(x + 10, y)
    //         if (denim.hasWeftOn(p1) && denim.hasWeftOn(p2))
    //             await new Loop([p1, p2], embColor).wiggle().shadow().draw()
    //     }
    // }

    // await makePatch(patchTypes.ROUND, makeColor(random(200, 240)), embColor)

    // for (let i=0;i<5;i++)
    //     await makePatch(patchTypes.ROUND, makeColor(random(200, 240), 255, 100))
}

async function largeRips() {
    print('composition - large rips')
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim = new Denim(pattern, neighborColor(denimColor, 0, 0, -150)).rotate(R.random(360))
    denim.visibleWhite = 1
    denim.darkness = .3
    denim.calc()

    denim2 = new Denim(pattern, denimColor).rotate(R.random(360))
    ripNoiseScale = [R.random(3, 7), R.random(3, 7)]
    denim2.ripThreshold = R.random(.25, .45)
    denim2.calc().makeRips()
    applyColorFunc(denim2, globalColorFunc)
    denim2.dropShadowOn([denim])
    await denim.draw({ dontFringe: true })
    await denim2.draw()
}

async function withFringe() {
    print('composition - fringe')
    pattern = new SquarePatternShape(0, 0, baseWidth, baseHeight)
    denim = new Denim(pattern, neighborColor(denimColor, 0, 0, -50)).rotate(R.random(360))
    denim.visibleWhite = 0
    denim.darkness = .3
    denim.calc()
    await denim.draw({dontFringe:true})

    const perc = R.random(.5, .8)
    const vertical = R.random_dec() < 0.5
    const doRotation = R.random_dec()<0.5
    if (vertical) pattern = new SquarePatternShape(-baseWidth/2, -baseHeight/2, baseWidth * (perc+0.5), baseHeight*2)
    else pattern = new SquarePatternShape(-baseWidth/2, -baseHeight/2, baseWidth*2, baseHeight*(perc+0.5))
    if (doRotation) pattern.rotateAround(v_rel(0.5, 0.5), 180)
    denim = new Denim(pattern, denimColor).rotate(vertical ? 0 : 90).calc()
    denim.warpExtensions = [R.random(10, 50), R.random(50, 200)]
    denim.extendChance = R.random(.7,1)
    await denim.draw()
}