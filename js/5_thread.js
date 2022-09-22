let franzimDirOffset
async function franzim(pos, dir, l) {
    if (!franzimDirOffset) franzimDirOffset = R.random(-45,45)
    threadSize = initialThreadSize * 0.8
    dir.setMag(3 * globalScale)
    let ps = [pos]
    for (let i = 0; i < l / dir.mag(); i++) {
        const noiseVal = noise(20 * ps[ps.length - 1].x / baseWidth, 20 * ps[ps.length - 1].y / baseHeight)
        const angle2 = (noiseVal - 0.5) * 120
        dir.rotate(angle2/10 + R.random(-5,5))
        ps.push(ps[ps.length - 1].copy().add(dir))
    }
    ps = makeCurve(ps)

    for (let i=0;i<ps.length;i++){
        await burn(ps[i].copy().add(6*i/ps.length,6*i/ps.length).mult(globalScale), this.threadSize * globalScale, 7)
    }

    await thread(ps, color(R.random_choice(warpColors)), 3, 50)
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
    getFinalColor() {
        let res = this.color
        if (this.age) res = lerpColor(res, color(R.random_choice(natural)), this.age)
        if (this.yellow) res = lerpColor(res, color('#ebe1a2'), this.yellow)
        if (this.darkness != 0) res = neighborColor(res, 0, .5*this.darkness*360,-.5*this.darkness*360)
        return res
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

async function thread(ps, clr, fluff = 1, alpha = 120) {
    newPs = ps.map(p=>p.copy().mult(globalScale))
    noFill()
    noStroke()
    let crv = newPs.map(p => p.copy())
    if (crv.length<2 || crvLength(crv)<1) return
    if (newPs.length < 10) crv = makeCurve(newPs)
    fill(clr)
    crv.forEach(p => circle(p.x, p.y, threadSize * globalScale))
    noFill()

    strokeWeight(0.2 * threadSize * globalScale)
    clr.setAlpha(alpha)
    stroke(clr)
    for (let f=0;f<fluff;f++)
        for (let i = 0; i < crv.length; i++) 
            await tinyThread(crv[i])
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