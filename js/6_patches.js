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
    const stitches = patchStitches(denim)
    const fringe = R.random_dec() < 0.5
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
        await new Loop(s.slice(0, 2), s[2] ?? patchStitchColor, initialThreadSize * 1.3).wiggle().shadow().draw()
        await timeout(0);
    }
}

function crossStitches(pattern) {
    let stitches = pattern.stitches(1, R.random(5, 15), R.random(5, 10), true).map(st => {
        const numStitches = R.random(3, 5)
        const l = vdist(st[0], st[1])
        const dir = vsub(st[1], st[0])
        const perp = dir.copy().rotate(80)
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
}