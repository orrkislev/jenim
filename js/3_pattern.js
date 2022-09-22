
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
    containingSquare() {
        const topMost = this.ps.reduce((a, b) => a.y < b.y ? a : b).y
        const bottomMost = this.ps.reduce((a, b) => a.y > b.y ? a : b).y
        const leftMost = this.ps.reduce((a, b) => a.x < b.x ? a : b).x
        const rightMost = this.ps.reduce((a, b) => a.x > b.x ? a : b).x
        return new SquarePatternShape(leftMost, topMost, rightMost - leftMost, bottomMost - topMost)
    }
    makeCurve() {
        this.ps = this.getCurve()
    }
    getCurve() {
        let crv = []
        for (let i = 0; i < this.ps.length; i++) {
            const crvPart = makeCurve([this.ps[i], this.ps[(i + 1) % this.ps.length]])
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
            const dir1 = p5.Vector.sub(p2, p1).setMag(r)
            const dir2 = p5.Vector.sub(p2, p3).setMag(r)
            newPs.push(p5.Vector.add(p2, dir2))
            newPs.push(p5.Vector.add(p2, dir1))
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
            const dir1 = p5.Vector.sub(p2, p1)
            const dir2 = p5.Vector.sub(p2, p3)
            let angle = dir2.angleBetween(dir1)
            if (angle < 0) angle += 360
            dir2.rotate(angle / 2).setMag(h * initialThreadSize)
            return p5.Vector.add(p2, dir2)
        })
        return newPs
    }
    stitches(h, l1, l2, handMade = false) {
        const offsetPattern = new LayoutPattern2(this.getOffset(h))
        const crv = offsetPattern.getCurve()
        const stitches = []
        l1 *= initialThreadSize
        l2 *= initialThreadSize
        for (let i = 0; i < crvLength(crv) - l1; i += handMade ? l2 * R.random(0.9, 1.2) : l2) {
            const p1 = placeOnCurve(crv, i)
            i += handMade ? l1 * R.random(0.9, 1.2) : l1
            const p2 = placeOnCurve(crv, i)
            if (p1 && p2) stitches.push([p1, p2])
        }
        return stitches
    }

    dropShadowOn(denim) {
        const shading = createGraphics(baseWidth, baseHeight)
        shading.noStroke()
        shading.fill(0, 5)
        shading.beginShape()
        this.getCurve().forEach(p => shading.vertex(p.x, p.y))
        shading.endShape()
        this.getCurve().forEach(p => shading.circle(p.x + 5, p.y + 5, threadSize * R.random(10)))
        denim.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    const c = shading.get(p.x, p.y)
                    if (alpha(c) > 0) {
                        // loop.age = 1 - alpha(c) / 255
                        loop.darkness = .2 - (alpha(c) / 255) / 5
                    }
                }
            })
        })
    }

    setStitches(stitchType, data) {
        this.stitchType = stitchType
        this.stitchData = data
    }

    async drawStitches(denim = null) {
        if (!this.stitchType) return
        let stitches = []
        for (const d of this.stitchData) {
            stitches = [...stitches,...this.stitches(d, 7, 6)]
        }

        if (this.stitchType == stitchTypes.HANDMADE) {
            for (const d of this.stitchData) {
                stitches = this.stitches(d, 6, 8, true)
                for (let st of stitches) {
                    st[0].add(R.random(-threadSize, threadSize))
                    st[1].add(R.random(-threadSize, threadSize))
                }
            }
        }

        for (let st of stitches) {
            const weftLoop = denim.hasWeftOn(st[0])
            if (weftLoop) {
                const newLoop = new Loop(st, stitchColor, initialThreadSize * 2).wiggle().shadow()
                newLoop.age = weftLoop.age
                await newLoop.draw()
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
        const w = p5.Vector.dist(this.ps[0], this.ps[3])
        const h = p5.Vector.dist(this.ps[0], this.ps[1])
        return { pos, w, h, rotation: this.rotation }
    }
}