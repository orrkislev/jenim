const compositions = [hem, twohalfs, withPocket, patches, largeRips, withFringe]

async function hem() {
    const hemPos = random(.2, .9)
    pattern = new SquarePatternShape(0, 0, width, height * hemPos)
    pattern2 = new SquarePatternShape(-100, height * hemPos, width + 200, height * (1 - hemPos) + 100)

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
    pattern_l = new SquarePatternShape(width / 2 - height, -100, height, height + 200)
    pattern_r = new SquarePatternShape(width / 2, -100, height, height + 200)
    const r = random(-30, 30)
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
    pattern = new SquarePatternShape(0, 0, width, height)
    pocketPattern = new LayoutPattern2([v(0, 0), v(120, 490), v(340, 570), v(580, 470), v(660, 0)]).fillet(12)
    const pocketCenter = pocketPattern.center()
    pocketPattern.ps.forEach(p => p.sub(pocketCenter))
    const x = random(width)
    const y = random(height - pocketCenter.y)
    pocketPattern.ps.forEach(p => p.add(x, y))

    rotation = random(40)
    pocketPattern.rotate(rotation)

    denim = new Denim(pattern, denimColor).rotate(rotation - 10).calc()
    pocket = new Denim(pocketPattern, denimColor).rotate(random(-60, 60))
    pocket.age = 0.2
    pocket.calc().makeRips()

    applyColorFunc(denim, globalColorFunc)
    applyColorFunc(pocket, globalColorFunc)

    pocket.foldedStitchings()
    pocket.dropShadowOn([denim])

    await denim.draw({ dontFringe: true })
    await pocket.draw({ dontFringe: true })
}

async function patches() {
    pattern = new SquarePatternShape(0, 0, width, height)
    denim = new Denim(pattern, denimColor).rotate(random(360)).calc().makeRips()
    applyColorFunc(denim, globalColorFunc)

    patch = roundPatch(random(30, 250), v_rel(random(.2, .8), random(.2, .8)), denimColor)
    if (random() < 0.3) patch = rectPatch(denimColor)
    applyPatchShadow(patch)
    applyPatch3dEffect(patch, denim)

    await denim.draw({ dontFringe: random() < 0.5, withBehind: true })
    await patch.draw({ dontFringe: random() < 0.5 })
    await patchStitches(patch)

    if (random() < .2) {
        for (let i = 0; i < random(10); i++) {
            patch = roundPatch(random(30, 250), v_rel(random(.2, .8), random(.2, .8)), denimColor)
            if (random() < 0.5) patch = rectPatch(denimColor)
            applyPatchShadow(patch)
            await patch.draw({ dontFringe: random() < 0.5 })
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
    pattern = new SquarePatternShape(0, 0, width, height)
    denim = new Denim(pattern, neighborColor(denimColor, 0, 0, -150)).rotate(random(360))
    denim.visibleWhite = 1
    denim.darkness = .3
    denim.calc()

    denim2 = new Denim(pattern, denimColor).rotate(random(360))
    ripNoiseScale = [random(2, 5), random(2, 5)]
    denim2.ripThreshold = random(.4, .6)
    denim2.calc().makeRips()
    applyColorFunc(denim2, globalColorFunc)

    denim2.dropShadowOn([denim])

    await denim.draw({ dontFringe: true })
    await denim2.draw()
}

async function withFringe() {
    pattern = new SquarePatternShape(0, 0, width, height)
    denim = new Denim(pattern, neighborColor(denimColor, 0, 0, -50)).rotate(random(360))
    denim.visibleWhite = 0
    denim.darkness = .3
    denim.calc()
    await denim.draw({dontFringe:true})

    const perc = random(.5, .8)
    const vertical = random() < 0.5
    const doRotation = random()<0.5
    if (vertical) pattern = new SquarePatternShape(-width/2, -height/2, width * (perc+0.5), height*2)
    else pattern = new SquarePatternShape(-width/2, -height/2, width*2, height*(perc+0.5))
    if (doRotation) pattern.rotateAround(v_rel(0.5, 0.5), 180)
    denim = new Denim(pattern, denimColor).rotate(vertical ? 0 : 90).calc()
    denim.warpExtensions = [random(10, 50), random(50, 200)]
    denim.extendChance = random(.7,1)
    await denim.draw()

    // if (perc < 0.5) {
    //     if (vertical) pattern = new SquarePatternShape(width * (1-perc*random(1,1.5)), 0, width,height)
    //     else pattern = new SquarePatternShape(0, height*(1-perc*random(1,1.5)),width,height)
    //     if (doRotation) pattern.rotateAround(v_rel(0.5, 0.5), 180)
    //     denim = new Denim(pattern, denimColor).rotate(random(360)).calc()
    //     denim.warpExtensions = [random(25, 50), random(100, 200)]
    //     denim.extendChance = random(.7,1)
    //     await denim.draw()
    // }
}