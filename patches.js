function roundPatch(size, position = v_rel(0.5, 0.5), color) {
    let ps = []
    ps = getEllipse(size * R.random(0.8, 1.2) * threadSize, size * R.random(0.8, 1.2) * threadSize, 45)
    ps.forEach(p => p.mult(R.random(.8, 2)))
    ps.forEach(p => p.add(position))
    ps = makeCurve(ps)
    return makePatch(ps, color)
}

function rectPatch(color) {
    const rectPattern = new SquarePatternShape(R.random(width), R.random(height), R.random(100, 400), R.random(100, 400))
    rectPattern.rotate(R.random(-5, 5))
    ps = rectPattern.ps
    return makePatch(ps, color)
}

function makePatch(ps, color) {
    const pattern = new LayoutPattern2(ps)
    const denim = new Denim(pattern, color, 0).rotate(R.random(360)).calc()
    applyPatchShadow(denim)
    return denim
}

function applyPatchShadow(denim) {
    innerPattern = new LayoutPattern2(denim.layoutPattern.getOffset(-3))
    innerPattern.ps.forEach(p => p.add(5, 5))
    innerPattern.makeCurve()

    const shading = createGraphics(width, height)
    shading.background(255)
    shading.noStroke()
    shading.fill(0)
    shading.beginShape()
    innerPattern.getCurve().forEach(p => shading.vertex(p.x,p.y))
    shading.endShape()
    shading.filter(BLUR,10)

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






async function patchStitches(patch) {
    threadSize = initialThreadSize
    let stitches = []
    const r = R.random_choice([1,2,3])
    if (r == 1) {
        stitches = crossStitches(patch.layoutPattern, R.random(2,8), [35,3,3,3])
    } else if (r==2) {
        stitches = patch.layoutPattern.stitches(6, 5, 5,true)
        if (R.random_dec()<0.5)
            stitches = stitches.concat(patch.layoutPattern.stitches(7, 5, 5,true))
        if (R.random_dec()<0.4)
            for (let i=1;i<R.random(3);i++){
                stitches = stitches.concat(patch.layoutPattern.stitches(6+R.random(5,40), 5, 5,true))
            }
    } else if (r==3) {
        stitches = patch.layoutPattern.stitches(-6, 5, 5,true)
        if (R.random_dec()<0.5)
            stitches = stitches.concat(patch.layoutPattern.stitches(-7, 5, 5,true))
        if (R.random_dec()<.7){
            stitches = stitches.concat(patch.layoutPattern.stitches(-3, 5, 5,true))
        }
    }
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
    // newPs = newPs.filter((p, i) => i % l == 0)
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

function crossStitches2(pattern,l, stitchPattern){
    let crv = pattern.getCurve()
    const totalLength = crvLength(crv)
    const stitches = []
    for (let i=0;i<totalLength;i+=stitchPattern.rotate()){
        const p1 = placeOnCurve(crv,i)
        if (!p1) continue
        const dir = p5.Vector.sub(pattern.center(),p1).setMag(R.random(.9,1.1)*l/2)
        const p2 = p5.Vector.add(p1,dir)
        const p3 = p5.Vector.add(p1,dir.mult(-1))
        stitches.push([p2,p3])
    }
    return stitches
}