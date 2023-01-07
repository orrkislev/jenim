let windTarget

async function franzim(pos, dir, l, trsz = .9) {
    if (!windTarget) windTarget = R.random(360)
    threadSize = initialThreadSize * trsz
    dir.setMag(1)
    let ps = [pos]
    // for (let i = 0; i < l; i++) {
    //     const noiseVal = noise(35 * ps[ps.length - 1].x / baseWidth, 35 * ps[ps.length - 1].y / baseHeight)
    //     const angle2 = (noiseVal - 0.5) * 6
    //     const wind = Math.sign(windTarget - dir.heading())
    //     dir.rotate(angle2 + R.random(-.2, .2) + wind * .1)
    //     ps.push(ps[ps.length - 1].copy().add(dir))
    // }

    const dir1 = dir.copy().rotate(90)
    const sumPoints = ceil(l / 10)
    for (let h = 0; h <= sumPoints; h++) {
        const newPos = ps[ps.length - 1]
        const offset = noise(newPos.x / 50, newPos.y / 50) * 40 - 20
        const noiseVal = noise(35 * ps[ps.length - 1].x / baseWidth, 35 * ps[ps.length - 1].y / baseHeight)
        const angle2 = (noiseVal - 0.5) * 60
        const wind = Math.sign(windTarget - dir.heading())
        const dirRotation = angle2 + R.random(-2, 2) + wind
        dir.rotate(dirRotation)
        dir1.rotate(dirRotation)
        const newPoint = newPos.copy().add(dir.copy().mult(10))
        newPoint.add(dir1.copy().mult(offset))
        ps.push(newPoint)
    }
    ps = toCrv(ps)
    if (ps.length < 2) return

    for (let i = 0; i < ps.length; i++) {
        await burn(ps[i].copy().add(6 * i / ps.length, 6 * i / ps.length).mult(globalScale), threadSize * globalScale * map(i, 0, ps.length, 1, 4), 5)
    }

    const clr = color(R.random_choice(warpColors))
    clr.setAlpha(150)
    await thread(ps, clr, 5, 50)
}

class Loop {
    constructor(ps, color, ts) {
        this.threadSize = ts || threadSize
        this.originalColor = color
        this.color = color
        this.ps = ps
        this.age = 0
        this.darkness = 0
    }
    wiggle() {
        const p1 = this.ps[0]
        const p2 = this.ps[this.ps.length - 1]
        const mid = vadd(p1, p2).div(2)
        const dir = vsub(p1, p2).rotate(90).normalize().mult(vdist(p1, p2) * R.random(-.05, .05))
        mid.add(dir)
        this.ps = [p1, mid, p2]
        return this
    }
    shadow(t = true, data = { times: 2, size: 2, opacity: 30, offset: v(2, 0) }) {
        if (t) this.withShadow = data
        else this.withShadow = false
        return this
    }
    getFinalColor() {
        let res = this.color
        if (this.age) res = lerpColor(res, color(R.random_choice(natural)), this.age)
        if (this.yellow) res = lerpColor(res, color('#ebe1a2'), this.yellow)
        if (this.darkness != 0) res = neighborColor(res, 0, .5 * this.darkness * 360, -.5 * this.darkness * 360)
        return res
    }
    applyColorFunc(colorFunc) {
        if (!colorFunc) return
        if (this.ps.length > 0) {
            const p = this.ps[0]
            this.color = colorFunc.func(this.color, p.x + colorFunc.offsetX, p.y + colorFunc.offsetY)
        }
    }
    async draw() {
        if (this.ps.length <= 1) return
        if (this.withShadow)
            for (let i = 0; i < this.withShadow.times; i++)
                for (const p of toCrv(this.ps))
                    await burn(p.copy().add(this.withShadow.offset).mult(globalScale), this.threadSize * globalScale * (this.withShadow.size + R.random(-1, 1)), this.withShadow.size.opacity)
        if (this.age) this.color = lerpColor(this.color, color(R.random_choice(natural)), this.age)
        if (this.yellow) this.color = lerpColor(this.color, color('#ebe1a2'), this.yellow)
        // if (this.darkness != 0) this.color = neighborColor(this.color, 0, .5 * this.darkness * 360, -.5 * this.darkness * 360)
        if (this.darkness != 0) this.color = neighborColor(this.color, 0, 0, -.5 * this.darkness * 360)
        // if (this.darkness != 0) this.color = lerpColor(this.color, color(0), this.darkness)
        threadSize = this.threadSize
        await thread(this.ps, this.color, 3)
    }
    dir() {
        if (this.ps.length <= 1) return v(0, 0)
        return vsub(this.ps[this.ps.length - 1], this.ps[0])
    }
}

let t1 = 0

async function thread(ps, clr, fluff = 1, alpha = 120) {
    if (ps[0].x < 0 || ps[0].y < 0 || ps[0].x > baseWidth || ps[0].y > baseHeight) return
    newPs = ps.map(p => p.copy().mult(globalScale))
    noFill()
    noStroke()
    let crv = newPs.map(p => p.copy())
    if (crv.length < 2 || crvLength(crv) < 1) return
    if (newPs.length < 10) crv = toCrv(newPs)
    fill(clr)
    crv.forEach(p => circle(p.x, p.y, threadSize * globalScale))
    noFill()

    strokeWeight(0.2 * threadSize * globalScale)
    clr.setAlpha(alpha)
    stroke(clr)
    fluff *= width / 1000
    for (let f = 0; f < fluff; f++)
        for (let i = 0; i < crv.length; i++)
            await tinyThread(crv[i])
}

let tinyThreadDir = 0
async function tinyThread(p, l = 1) {
    noFill()
    beginShape()
    curveVertex(p.x, p.y)
    curveVertex(p.x, p.y)
    curveVertex(p.x + threadSize * globalScale * cos(tinyThreadDir += 35) * l, p.y + threadSize * globalScale * sin(tinyThreadDir += 35) * l)
    curveVertex(p.x + threadSize * globalScale * sin(tinyThreadDir += 70) * l, p.y + threadSize * globalScale * cos(tinyThreadDir += 70) * l)
    curveVertex(p.x + threadSize * globalScale * cos(tinyThreadDir += 100) * l, p.y + threadSize * globalScale * sin(tinyThreadDir += 105) * l)
    endShape()
    if (tinyThreadDir > 10000) tinyThreadDir = 0
}