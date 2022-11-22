
const stitchTypes = {
    SINGLE: 0,
    DOUBLE: 1,
    CROSS: 2,
    ZIGZAG: 3
}

class PatternShape {
    constructor(ps) {
        this.ps = ps
    }
    draw() {
        beginShape()
        this.ps.forEach(p => vertex(p.x, p.y))
        endShape(CLOSE)
    }
    center() {
        let all = v(0, 0)
        this.ps.forEach(p => all.add(p))
        all.div(this.ps.length)
        return all
    }
    rotate(rotation) {
        const c = this.center()
        this.rotateAround(c, rotation)
    }
    rotateAround(c, rotation) {
        const newPs = this.ps.map(p => p.copy().sub(c))
        newPs.forEach(p => p.rotate(rotation))
        newPs.forEach(p => p.add(c))
        this.ps = newPs
    }
    rotatedContainingSquare(rotation) {
        const c = this.center()
        this.rotate(-rotation)
        const cont = this.containingSquare()
        cont.rotateAround(c, rotation)
        this.rotate(rotation)
        return cont
    }
    bounds() {
        return {
            top: this.ps.reduce((a, b) => a.y < b.y ? a : b).y,
            bottom: this.ps.reduce((a, b) => a.y > b.y ? a : b).y,
            left: this.ps.reduce((a, b) => a.x < b.x ? a : b).x,
            right: this.ps.reduce((a, b) => a.x > b.x ? a : b).x
        }
    }
    containingSquare() {
        const bounds = this.bounds()
        return new SquarePatternShape(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top)
    }
    toCrv() {
        this.ps = this.crv()
    }
    crv() {
        let crv = []
        for (let i = 0; i < this.ps.length; i++) {
            const crvPart = toCrv([this.ps[i], this.ps[(i + 1) % this.ps.length]])
            crv = crv.concat(crvPart.slice(0, crvPart.length - 1))
        }
        return crv
    }
    goAlong(func) {
        for (const p of this.ps) {
            func(p)
        }
    }
    async asyncGoAlong(func) {
        for (const p of this.ps) {
            await func(p)
        }
    }
    fillet(r) {
        const newPs = []
        for (let i = 0; i < this.ps.length; i++) {
            const p1 = this.ps[i]
            const p2 = this.ps[(i + 1) % this.ps.length]
            const p3 = this.ps[(i + 2) % this.ps.length]
            const dir1 = vsub(p2, p1).setMag(r)
            const dir2 = vsub(p2, p3).setMag(r)
            newPs.push(vadd(p2, dir2))
            newPs.push(vadd(p2, dir1))
        }
        this.ps = newPs
        return this
    }
}

const p2i = (x, y, d) => {
    return ((round(x) - 1 / d) * d + ((round(y) - 1 / d) * d) * (round(baseWidth) * d)) * 4
}

class LayoutPattern2 extends PatternShape {
    constructor(ps) {
        super(ps)
    }
    makeGraphics() {
        this.graphics = createGraphics(baseWidth, baseHeight)
        this.graphics.beginShape()
        this.ps.forEach(p => this.graphics.vertex(p.x, p.y))
        this.graphics.endShape(CLOSE)
        this.graphicsDensity = this.graphics.pixelDensity()
        this.graphics.loadPixels()
    }
    pointInPattern(p) {
        if (!this.graphics) this.makeGraphics()
        // exit()
        // const i = p2i(p.x, p.y, this.graphicsDensity)
        // return this.graphics.pixels[i + 3] > 0
        return alpha(this.graphics.get(p.x, p.y)) > 0
    }
    getOffset(h) {
        let newPs = [...this.ps]
        newPs.push(this.ps[0])
        newPs = newPs.map((p1, i) => {
            const p2 = this.ps[(i + 1) % this.ps.length]
            const p3 = this.ps[(i + 2) % this.ps.length]
            const dir1 = vsub(p2, p1)
            const dir2 = vsub(p2, p3)
            let angle = dir2.angleBetween(dir1)
            if (angle < 0) angle += 360
            dir2.rotate(angle / 2).setMag(h * initialThreadSize)
            return vadd(p2, dir2)
        })
        return newPs
    }
    stitches(h, l1, l2, handMade = false) {
        const offsetPattern = new LayoutPattern2(this.getOffset(h))
        const crv = offsetPattern.crv()
        const stitches = []
        l1 *= initialThreadSize
        l2 *= initialThreadSize
        for (let i = 0; i < crvLength(crv) - l1; i += handMade ? l2 * R.random(0.9, 1.6) : l2) {
            const p1 = placeOnCurve(crv, i)
            if (!p1) continue
            i += handMade ? l1 * R.random(0.9, 1.6) : l1
            const p2 = placeOnCurve(crv, i)
            if (!p2) break
            if (inCanvas(p1) || inCanvas(p2)) stitches.push([p1, p2])
        }
        return stitches
    }

    dropShadowOn(denim) {
        const shading = createGraphics(baseWidth, baseHeight)
        shading.noStroke()
        shading.fill(0, 10)
        shading.beginShape()
        this.crv().forEach(p => shading.vertex(p.x, p.y))
        shading.endShape()
        this.crv().forEach(p => shading.circle(p.x, p.y, threadSize * R.random(15)))
        denim.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    const c = shading.get(p.x, p.y)
                    if (alpha(c) > 0) {
                        // loop.age = 1 - alpha(c) / 255
                        loop.darkness = .4 - (brightness(c) / 360) * (alpha(c) / 255) * .4
                    }
                }
            })
        })
    }

    setStitches(data) {
        this.stitchData = data
    }

    async drawStitches(denim = null) {
        if (!this.stitchData) return

        const stitchType = this.stitchData.length == 2 ?
            R.random_choice(['normal', 'doubleTrim', 'force']) :
            R.random_choice(['normal', 'trim', 'zigzag', 'force'])

        let rows = []
        for (const d of this.stitchData) {
            rows.push(this.stitches(d, 12, 4))
        }

        if (['trim', 'doubleTrim'].includes(stitchType)) rows[rows.length - 1].splice(round(rows[rows.length - 1].length * R.random(.3, .7)))

        // DRAW STITCHES
        for (let row of rows) {
            for (let st of row) {
                const weftLoop = denim.hasWeftOn(st[0])
                if (weftLoop) {
                    const newLoop = new Loop(st, stitchColor, initialThreadSize * 1.3).wiggle().shadow()
                    newLoop.age = weftLoop.age
                    await newLoop.draw()
                    await timeout()
                }
            }
        }

        // DRAW EXTRAS
        const extraColor = R.random_choice([stitchColor, R.random_choice([color(0), color(255, 0, 0), color(255)])])
        if (stitchType == 'doubleTrim') {
            const lastStitch = rows[1][rows[1].length - 1]
            const stitchDir = vsub(lastStitch[1], lastStitch[0]).setMag(5)
            const fillDir = stitchDir.copy().rotate(90)
            const distBetweenStitches = (this.stitchData[1] - this.stitchData[0])

            for (let i = -1 * globalScale; i < distBetweenStitches + 2 * globalScale; i += R.random(5) * globalScale) {
                const p1 = vadd(lastStitch[0].add(stitchDir.copy().setMag(R.random(-2, 2) * globalScale)), fillDir.copy().setMag(i))
                const p2 = vadd(lastStitch[1].add(stitchDir.copy().setMag(R.random(-2, 2) * globalScale)), fillDir.copy().setMag(i))
                const weftLoop = denim.hasWeftOn(p1)
                if (weftLoop) {
                    const newLoop = new Loop([p1, p2], extraColor, initialThreadSize * 1.3).wiggle().shadow()
                    newLoop.age = weftLoop.age
                    await newLoop.draw()
                    await timeout()
                }
            }
        }

        if (['trim', 'force'].includes(stitchType)) {
            const lastRow = rows[rows.length - 1]
            const lastStitch = stitchType == 'trim' ? lastRow[lastRow.length - 1] : R.random_choice(lastRow)
            const stitchDir = vsub(lastStitch[1], lastStitch[0])
            const perp = stitchDir.copy().rotate(90)
            const l = R.random(50, 100)
            for (let i = 1; i < l; i += R.random(5)) {
                const p0 = vadd(lastStitch[1], stitchDir.copy().setMag(i * globalScale))
                const dir = perp.copy().rotate(R.random(-10, 10)).setMag(R.random(5, 10) * globalScale)
                const p1 = vadd(p0, dir)
                const p2 = vsub(p0, dir)
                const weftLoop = denim.hasWeftOn(p1)
                if (weftLoop) {
                    const newLoop = new Loop([p1, p2], extraColor, initialThreadSize * 1.3).wiggle().shadow()
                    newLoop.age = weftLoop.age
                    await newLoop.draw()
                    await timeout()
                }
            }
        }
        if (stitchType == 'zigzag') {
            const startStitchIndex = round(rows[0].length * R.random(.1, .7))
            const endStitchIndex = floor(R.random(startStitchIndex, rows[0].length * (.9)))
            for (let i = startStitchIndex; i < endStitchIndex; i++) {
                const st = rows[0][i]
                const dir = vsub(st[1], st[0]).rotate(45)
                const p1 = vadd(st[0], dir)

                let newLoop = new Loop([st[0], p1], extraColor, initialThreadSize * 1.3).wiggle().shadow()
                await newLoop.draw()

                newLoop = new Loop([p1, st[1]], extraColor, initialThreadSize * 1.3).wiggle().shadow()
                await newLoop.draw()
                await timeout()
            }
        }
    }
}

class SquarePatternShape extends LayoutPattern2 {
    constructor(left, top, ww, hh) {
        super([v(left, top), v(left, top + hh), v(left + ww, top + hh), v(left + ww, top)])
        this.rotation = 0
    }
    rotateAround(c, rotation) {
        this.rotation = rotation
        super.rotateAround(c, rotation)
    }
    getDimension() {
        const pos = this.ps[0]
        const w = vdist(this.ps[0], this.ps[3])
        const h = vdist(this.ps[0], this.ps[1])
        return { pos, w, h, rotation: this.rotation }
    }
}const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

function checkers() {
    const gridSize = 120 * initialThreadSize
    const haldGridSize = 60 * initialThreadSize
    return (clr, x, y) => {
        if ((x % gridSize < haldGridSize && y % gridSize < haldGridSize) || (x % gridSize > haldGridSize && y % gridSize > haldGridSize)) {
            clr = lerpColor(clr, color(0), 0.3)
        }
        return clr
    }
}
function bleach_gradient() {
    return (clr, x, y) => {
        clr = lerpColor(clr, color(255), 1 - y / baseHeight)
        return clr
    }
}
function bleach_noise() {
    const noiseScale = R.random(50, 150) * initialThreadSize
    const xoffset = R.random(10000)
    const yoffset = R.random(10000)
    const threshold = R.random(0.2, 0.8)
    const noiseNoise = round(R.random())
    return (clr, x, y) => {
        const v = noise(x / noiseScale + xoffset, y / noiseScale + yoffset, R.random(0.3) * noiseNoise)
        if (v < threshold) clr = lerpColor(clr, color(255), v + .5)
        else if (v < threshold + .1) clr = lerpColor(clr, color(255), map(v, threshold, threshold + .1, threshold + .5, 0))
        return clr
    }
}
function bleach_large() {
    const bleachScale = R.random(20, 100) * initialThreadSize
    const xoffset = R.random(10000)
    const yoffset = R.random(10000)
    return (clr, x, y) => {
        val = y / baseHeight
        if (noise(x / bleachScale + xoffset, y / bleachScale + yoffset) < val) clr = lerpColor(clr, color(255), val)
        return clr
    }
}

function strips() {
    const stripYSize = R.random(3)
    return (clr, x, y) => {
        if ((x + floor(y / stripYSize)) % (120 * initialThreadSize) < (60 * initialThreadSize)) clr = lerpColor(clr, color(255), 0.4)
        return clr
    }
}

let paintersLayers = []

const camoColors = ['#2E2C24', '#AC9F7C', '#503F38', '#56583D', '#E5E7EB', '#9D2328']
function painters_camo() {
    camoColors.sort(() => R.random_dec() - .5)
    for (let i = 0; i < 4; i++)
        paintersLayers.push({
            s: R.random(100, 400), val: R.random(.4, .6), z: R.random(10), color: color(camoColors[i])
        })
    return (clr, x, y) => {
        for (let i = paintersLayers.length - 1; i >= 0; i--) {
            const paintersLayer = paintersLayers[i]
            if (noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) < paintersLayer.val)
                clr = lerpColor(clr, paintersLayer.color, .8)
        }
        return clr
    }
}
function painters_grad() {
    const hue = R.random(360)
    for (let i = 0; i < 2; i++)
        paintersLayers.push({
            s: R.random(100, 400), val: R.random(.4, .6), z: R.random(10), color: makeColor((hue + R.random(-60, 60)) % 360, 360, R.random(200, 360))
        })
    return (clr, x, y) => {
        for (let i = paintersLayers.length - 1; i >= 0; i--) {
            const paintersLayer = paintersLayers[i]
            clr = lerpColor(clr, paintersLayer.color, noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) * (1 - y / baseHeight))
        }
        return clr
    }
}
function painters_pollock() {
    polockImage = createGraphics(baseWidth, baseHeight)
    const sumSplashes = map(initialThreadSize, 0.5, 2, 500, 150)
    const splashScale = R.random()
    for (let i = 0; i < sumSplashes; i++) {
        polockImage.fill(R.random_choice([color(0), color(255)]))
        polockImage.noStroke()
        const pos = v(R.random(baseWidth), R.random(baseHeight))
        const dir = v(R.random(-.1, .1), R.random(-.1, .1))
        const l = R.random(200, 30) * initialThreadSize * splashScale
        let noiseVal = R.random(100)
        for (let j = 0; j < l; j++) {
            const size = noise(noiseVal, 10) ** 2 * map(j, 0, l, 45, 5) * initialThreadSize
            noiseVal += 0.02
            polockImage.circle(pos.x, pos.y, size)
            pos.add(dir)
            dir.rotate(R.random(-4, 4))
            dir.setMag(dir.mag() * 1.04)
        }
    }
    return (clr, x, y) => {
        const c = polockImage.get(x, y)
        if (c[3] > 0) return lerpColor(clr, color(c), 0.7)
        return clr
    }
}



function getColorFunc() {
    let r = R.random_dec()
    if (r < 0.5) return null

    let options = [bleach_gradient, bleach_large, bleach_noise, strips, checkers, painters_camo, painters_pollock, painters_grad]
    if (composition.name == "withDivide") options = [bleach_gradient, bleach_large, bleach_noise, strips, checkers]
    res = R.random_choice(options)
    return res
}






function applyColorFunc(denim, colorFunc) {
    if (colorFunc) {
        colorFunc = colorFunc()
        const offsetPosX = R.random(-35, 35)
        const offsetPosY = R.random(-35, 35)
        denim.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    loop.color = colorFunc(loop.color, p.x + offsetPosX, p.y + offsetPosY)
                }
            })
        })
    }
}




const initBaseColor = () => {
    const r = R.random_dec()
    if (r < 0.7) {
        stitchColor = color('orange')
        denimColor = makeColor(R.random(195, 240), 360, R.random(180, 360))
        patchStitchColor = R.random_choice([color(255, 0, 0), color(0), color(255)])
    } else if (r < 0.8) {
        stitchColor = color(255)
        denimColor = makeColor(0, 0, 0)
        patchStitchColor = color(255)
    } else {
        stitchColor = color(255)
        denimColor = makeColor(R.random(0, 70), R.random(200, 360), R.random(100, 250))
        patchStitchColor = color(0)
    }
}



function makeColor(h, s = 360, b = 360) {
    colorMode(HSB, 360)
    let c = color(h, s, b)
    colorMode(RGB)
    c = c.toRGB()
    return c
}
function neighborColor(c, h = 0, s = null, b = null) {
    colorMode(HSB, 360)
    const newH = hue(c) + h
    const newS = s == null ? R.random(360) : map(saturation(c), 0, 100, 0, 360) + s
    const newB = b == null ? R.random(360) : brightness(c) + b
    let c1 = color(newH, newS, newB)
    colorMode(RGB)
    c1 = c1.toRGB()
    return c1
}let windTarget

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
        const dirRotation = angle2 + R.random(-2,2) + wind
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