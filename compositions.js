const compositions = [hem, twohalfs, withPocket, patches, largeRips]

async function hem() {
    pattern = new SquarePatternShape(0, 0, width, height * 0.7)
    pattern2 = new SquarePatternShape(-100, height * 0.7, width + 200, height * 0.3 + 100)

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

async function halfsVertical() {
    pattern_l = new SquarePatternShape(-100, -100, width / 2 + 100, height + 200)
    pattern_r = new SquarePatternShape(width / 2, -100, width / 2 + 100, height + 200)

    denim_r = new Denim(pattern_r, denimColor).rotate(-10).calc().makeRips()
    denim_l = new Denim(pattern_l, denimColor).rotate(10).calc().makeRips()
    denim_l.age = 1.5
    denim_r.age = 1.5

    applyColorFunc(denim_r, globalColorFunc)
    applyColorFunc(denim_l, globalColorFunc)

    denim_l.foldedStitchings()
    denim_l.dropShadowOn([denim_r])

    await denim_r.draw({ dontFringe: true })
    await denim_l.draw({ dontFringe: true })
}

async function twohalfs() {
    pattern_l = new SquarePatternShape(width / 2 - height, -100, height, height + 200)
    pattern_r = new SquarePatternShape(width / 2, -100, height, height + 200)
    const r = random(-30,30)
    pattern_r.rotateAround(v_rel(0.5, 0.5), r)
    pattern_l.rotateAround(v_rel(0.5, 0.5), r)

    denim_r = new Denim(pattern_r, denimColor).rotate(-10).calc().makeRips()
    denim_l = new Denim(pattern_l, denimColor).rotate(10).calc().makeRips()
    denim_l.age = 1.5
    denim_r.age = 1.5

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

async function quarters() {
    const pattern_tl = new SquarePatternShape(0, 0, width / 2, height / 2)
    const pattern_tr = new SquarePatternShape(width / 2, 0, width / 2, height / 2)
    const pattern_bl = new SquarePatternShape(0, height / 2, width / 2, height / 2)
    const pattern_br = new SquarePatternShape(width / 2, height / 2, width / 2, height / 2)

    denimColor2 = neighborColor(denimColor, 0, 0, -360)

    const denim_tl = new Denim(pattern_tl, denimColor).rotate(20).calc()
    const denim_tr = new Denim(pattern_tr, denimColor2).rotate(-20).calc()
    const denim_bl = new Denim(pattern_bl, denimColor2).rotate(-20).calc()
    const denim_br = new Denim(pattern_br, denimColor).rotate(20).calc()

    applyColorFunc(denim_tl, globalColorFunc)
    applyColorFunc(denim_tr, globalColorFunc)
    applyColorFunc(denim_bl, globalColorFunc)
    applyColorFunc(denim_br, globalColorFunc)

    await denim_tl.draw()
    await denim_tr.draw()
    await denim_bl.draw()
    await denim_br.draw()
}

async function patches() {
    pattern = new SquarePatternShape(0, 0, width, height)
    denim = new Denim(pattern, denimColor).rotate(random(360)).calc().makeRips()
    applyColorFunc(denim, globalColorFunc)

    patch = roundPatch(random(30, 100), v_rel(random(.2, .8), random(.2, .8)), denimColor)
    applyPatchShadow(patch)
    applyPatch3dEffect(patch, denim)

    await denim.draw({ dontFringe: random() < 0.5, withBehind: true })
    await patch.draw({ dontFringe: random() < 0.5 })
    await patchStitches(patch)


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
    ripNoiseScale = [random(2,5),random(2,5)]
    denim2.ripThreshold = random(.4,.6)
    denim2.calc().makeRips()
    applyColorFunc(denim2, globalColorFunc)

    denim2.dropShadowOn([denim])

    await denim.draw({ dontFringe: true })
    await denim2.draw()
}