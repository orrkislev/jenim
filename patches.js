function roundPatch(size, position = v_rel(0.5, 0.5), color) {
    let ps = []
    ps = getEllipse(size * random(0.8, 1.2), size * random(0.8, 1.2), 45)
    ps.forEach(p => p.mult(random(.8, 2)))
    ps.forEach(p => p.add(position))
    ps = makeCurve(ps)
    return makePatch(ps, color)
}

function rectPatch(color) {
    const rectPattern = new SquarePatternShape(random(width), random(height), random(100, 200), random(100, 200))
    rectPattern.rotate(random(-5, 5))
    ps = rectPattern.ps
    return makePatch(ps, color)
}

function makePatch(ps, color) {
    const pattern = new LayoutPattern2(ps)
    const denim = new Denim(pattern, color, 0).rotate(random(360)).calc()
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
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,random(50)))
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,random(30)))
    innerPattern.getCurve().forEach(p => shading.circle(p.x,p.y,random(10)))

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






async function patchStitches(patch, colorStitch) {
    threadSize = initialThreadSize
    let stitches = []
    if (random() < 0) {
        stitches = crossStitches2(patch.layoutPattern, 20, [ 15,2,])
    } else {
        stitches = patch.layoutPattern.stitches(6, 5, 5,true)
        for (let i=1;i<15;i++){
            stitches = stitches.concat(patch.layoutPattern.stitches(6+random(9,12)*i, 5, 5,true))
        }
    }
    for (const s of stitches){
        await new Loop(s, colorStitch).wiggle().shadow().draw()
        await timeout(0);
    }
}






function crossStitches(pattern, h, l) {
    let newPs = [...pattern.ps]
    newPs.push(pattern.ps[0])
    newPs = makeCurve(newPs)
    newPs = newPs.filter((p, i) => i % l == 0)
    pattern.ps = newPs
    const offset1 = pattern.getOffset(h)
    const offset2 = pattern.getOffset(-h)
    const stitches = []
    for (let i = 0; i < offset1.length; i++) {
        offset1[i].add(random(-2, 2), random(-2, 2))
        offset2[i].add(random(-2, 2), random(-2, 2))
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
        const dir = p5.Vector.sub(pattern.center(),p1).setMag(random(.9,1.1)*l/2)
        const p2 = p5.Vector.add(p1,dir)
        const p3 = p5.Vector.add(p1,dir.mult(-1))
        stitches.push([p2,p3])
    }
    return stitches
}