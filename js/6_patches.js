function roundPatch(size, position = v_rel(0.5, 0.5), color) {
    print('round patch')
    let ps = []
    ps = getEllipse(size * R.random(0.8, 1.2) * threadSize, size * R.random(0.8, 1.2) * threadSize, 45)
    ps.forEach(p => p.mult(R.random(.8, 2)))
    ps.forEach(p => p.add(position))
    ps = makeCurve(ps)
    return makePatch(ps, color)
}

function rectPatch(color) {
    print('rect patch')
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