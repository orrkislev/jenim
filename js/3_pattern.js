
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
}