async function franzim(pos, dir, l) {
    dir.setMag(3)
    let ps = [pos]
    for (let i = 0; i < l / 3; i++) {
        let h = dir.heading()
        const noiseVal = noise(ps[ps.length - 1].x / 20, ps[ps.length - 1].y / 20)
        const angle2 = (noiseVal - 0.5) * 720
        h = lerp(h, angle2, 0.1)
        h = lerp(h, 90, 0.1)
        h += random(-5, 5)
        dir.setHeading(radians(h))
        ps.push(ps[ps.length - 1].copy().add(dir))
    }
    ps = makeCurve(ps)
    await thread(ps, color(choose(warpColors)), 3)
}

class Loop {
    constructor(ps, color, ts) {
        this.threadSize = ts ?? threadSize
        this.originalColor = color
        this.color = color
        this.ps = ps
        this.age = 0
        this.darkness = 0
    }
    wiggle() {
        const p1 = this.ps[0]
        const p2 = this.ps[this.ps.length-1]
        const mid = p5.Vector.add(p1, p2).div(2)
        const dir = p5.Vector.sub(p1, p2).rotate(90).normalize().mult(p5.Vector.dist(p1, p2) * random(-.05, .05))
        mid.add(dir)
        this.ps = [p1, mid, p2]
        return this
    }
    shadow(t = true) {
        this.withShadow = t
        return this
    }
    async draw() {
        if (this.withShadow)
            for (const p of makeCurve(this.ps)) await burn(p.copy().add(2, 0), this.threadSize * random(1, 3), 10)
        this.color = lerpColor(this.color, color(choose(natural)), this.age)
        if (this.darkness != 0) this.color = neighborColor(this.color, 0, 0, -this.darkness * 360)
        threadSize = this.threadSize
        await thread(this.ps, this.color, 3)
    }
    dir() {
        if (this.ps.length <= 1) return v(0, 0)
        return p5.Vector.sub(this.ps[this.ps.length - 1], this.ps[0])
    }
}

async function thread(ps, clr, fluff = 1) {
    noFill()
    noStroke()
    let crv = ps.map(p => p.copy())
    if (ps.length < 10)
        crv = makeCurve(ps)
    fill(clr)
    crv.forEach(p => circle(p.x, p.y, threadSize))

    noStroke()
    clr.setAlpha(80)
    fill(clr)
    for (let i = 0; i < crv.length - 1; i++) {
        push()
        const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
        translate(crv[i].x, crv[i].y)
        rotate(dir)
        ellipse(0, 0, threadSize * 0.9, threadSize * 0.54)
        pop()
    }
    // strokeWeight(1)
    // const arcPs = getEllipse(threadSize, threadSize, 45, 180, 360)
    // arcPs.forEach(p => p.y *= 0.6)
    // const twistK = random(-0.2, 0.2)
    // const c = neighborColor(clr)
    // for (let i = 0; i < crv.length - 1; i++) {
    //     const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
    //     const newPs = arcPs.map(p => p.copy())
    //     newPs.forEach(p => p.y *= map(i, 0, crv.length, -1, 1))
    //     newPs.forEach(p => p.rotate(dir))
    //     newPs.forEach(p => p.add(crv[i]))
    //     for (let pIndex = 0; pIndex < newPs.length; pIndex++) {
    //         let val = getShadeAtVal(shade_round, i / crv.length) * 150
    //         val += getShadeAtAngle(shade_round_shiny, pIndex * 7.5) * 0
    //         val += (i % (10 + pIndex * twistK)) / (10 + pIndex * twistK) * 50
    //         c.setAlpha(val * 0.2)
    //         stroke(c)
    //         await drawDot(newPs[pIndex])
    //     }
    // }

    for (let i = 0; i < crv.length * fluff; i++) await tinyThread(choose(crv), clr)

}

async function tinyThread2(p, clr, l = 1) {
    strokeWeight(0.5)
    noFill()
    const dir = p5.Vector.random2D().normalize()
    const lintLength = random(2, threadSize) * l
    clr.setAlpha(50)
    stroke(clr)
    for (let j = 0; j < lintLength; j++) {
        dir.rotate(radians(random(-15, 15)))
        p.add(dir)
        await drawDot(p)
    }
}

async function tinyThread(p, clr, l = 1) {
    strokeWeight(0.5)
    noFill()
    clr.setAlpha(50)
    stroke(clr)
    beginShape()
        curveVertex(p.x,p.y)
        curveVertex(p.x+threadSize * random(-1,1)*l,p.y+threadSize * random(-1,1)*l)
        curveVertex(p.x+threadSize * random(-1,1)*l,p.y+threadSize * random(-1,1)*l)
        curveVertex(p.x+threadSize * random(-1,1)*l,p.y+threadSize * random(-1,1)*l)
    endShape()
}