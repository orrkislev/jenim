const initThreadParams = ()=>{
    franzimDirOffset = R.random(360)
}

async function franzim(pos, dir, l) {
    threadSize = initialThreadSize * 0.8
    dir.setMag(3)
    let ps = [pos]
    for (let i = 0; i < l / 3; i++) {
        let h = dir.heading()
        const noiseVal = noise(ps[ps.length - 1].x * globalScale/ 20, ps[ps.length - 1].y * globalScale/ 20)
        const angle2 = (noiseVal - 0.5) * 720 + franzimDirOffset
        h = lerp(h, angle2, 0.1)
        h = lerp(h, 90, 0.1)
        h += R.random(-5, 5)
        dir.setHeading(radians(h))
        ps.push(ps[ps.length - 1].copy().add(dir))
    }
    ps = makeCurve(ps)

    for (let i=0;i<ps.length;i++){
        await burn(ps[i].copy().add(6*i/ps.length,6*i/ps.length).mult(globalScale), this.threadSize * globalScale, 7)
    }

    await thread(ps, color(R.random_choice(warpColors)), 3)
    franzimDirOffset += 0.1
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
        const p2 = this.ps[this.ps.length - 1]
        const mid = p5.Vector.add(p1, p2).div(2)
        const dir = p5.Vector.sub(p1, p2).rotate(90).normalize().mult(p5.Vector.dist(p1, p2) * R.random(-.05, .05))
        mid.add(dir)
        this.ps = [p1, mid, p2]
        return this
    }
    shadow(t = true) {
        this.withShadow = t
        return this
    }
    async draw() {
        if (this.ps.length<=1)return
        if (this.withShadow)
            for (const p of makeCurve(this.ps)) await burn(p.copy().add(2, 0).mult(globalScale), this.threadSize * globalScale * R.random(1, 3), 10)
        if (this.age) this.color = lerpColor(this.color, color(R.random_choice(natural)), this.age)
        if (this.yellow) this.color = lerpColor(this.color, color('#ebe1a2'), this.yellow)
        if (this.darkness != 0) this.color = neighborColor(this.color, 0, .5*this.darkness*360,-.5*this.darkness*360)
        threadSize = this.threadSize
        await thread(this.ps, this.color, 3)
    }
    dir() {
        if (this.ps.length <= 1) return v(0, 0)
        return p5.Vector.sub(this.ps[this.ps.length - 1], this.ps[0])
    }
}

let t1 = 0

async function thread(ps, clr, fluff = 1) {
    // return
    newPs = ps.map(p=>p.copy().mult(globalScale))
    noFill()
    noStroke()
    let crv = newPs.map(p => p.copy())
    if (crv.length<2 || crvLength(crv)<1) return
    if (newPs.length < 10) crv = makeCurve(newPs)
    fill(clr)
    crv.forEach(p => circle(p.x, p.y, threadSize * globalScale))
    noFill()

    // noStroke()
    // clr.setAlpha(80)
    // fill(clr)
    // for (let i = 0; i < crv.length - 1; i++) {
    //     push()
    //     const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
    //     translate(crv[i].x, crv[i].y)
    //     rotate(dir)
    //     ellipse(0, 0, threadSize * 0.9, threadSize * 0.54)
    //     pop()
    // }

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

    strokeWeight(0.2 * threadSize * globalScale)
    clr.setAlpha(50)
    stroke(clr)
    for (let f=0;f<fluff;f++)
        for (let i = 0; i < crv.length; i++) 
            await tinyThread(crv[i])
}

async function tinyThread2(p, clr, l = 1) {
    const pos = p.copy().mult(globalScale)
    strokeWeight(0.5)
    noFill()
    const dir = p5.Vector.random2D().normalize()
    const lintLength = R.random(2, threadSize) * l
    clr.setAlpha(50)
    stroke(clr)
    for (let j = 0; j < lintLength; j++) {
        dir.rotate(radians(R.random(-15, 15)))
        pos.add(dir)
        await drawDot(pos)
    }
}

let tinyThreadDir = 0
async function tinyThread(p, l = 1) {
    noFill()
    beginShape()
    curveVertex(p.x, p.y)
    curveVertex(p.x, p.y)
    curveVertex(p.x + threadSize * globalScale * cos(tinyThreadDir+=35) * l, p.y + threadSize * globalScale * sin(tinyThreadDir+=35) * l)
    curveVertex(p.x + threadSize * globalScale * sin(tinyThreadDir+=70) * l, p.y + threadSize * globalScale * cos(tinyThreadDir+=70) * l)
    curveVertex(p.x + threadSize * globalScale * cos(tinyThreadDir+=100) * l, p.y + threadSize * globalScale * sin(tinyThreadDir+=105) * l)
    endShape()
    if (tinyThreadDir>10000) tinyThreadDir = 0
}