
class Shape {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.readyToStipple = false
        this.ps = []
        this.pallete = null
    }

    copy() {
        const newS = new Shape(this.x, this.y)
        newS.ps = this.ps.map(p => p.copy())
        newS.readyToStipple = false
        newS.pallete = this.pallete
        return newS
    }

    bulge(dir, w = 80, size = .5) {
        const aStart = dir - w / 2
        const aEnd = dir + w / 2
        this.ps.forEach(p => {
            if (p.heading() > aStart && p.heading() < aEnd) p.mult(size)
        })
        return this
    }

    makeCurve() {
        this.ps.push(this.ps[0])
        this.ps.push(this.ps[1])
        const newCurve = []
        for (let i = 0; i < this.ps.length - 1; i++) {
            const curr = this.ps[i]
            const next = this.ps[i + 1]
            const l = p5.Vector.dist(curr, next)
            const control1 = i > 0 ? this.ps[i - 1] : curr
            const control2 = i < this.ps.length - 2 ? this.ps[i + 2] : next
            for (let j = 0; j < l; j++) {
                const t = j / l
                const x = curvePoint(control1.x, curr.x, next.x, control2.x, t)
                const y = curvePoint(control1.y, curr.y, next.y, control2.y, t)
                newCurve.push(v(x, y))
            }
        }
        this.ps = newCurve
    }

    prepareTransfer() {
        this.makeCurve()

        this.top = this.ps.reduce((a, b) => a.y < b.y ? a : b).y
        this.bottom = this.ps.reduce((a, b) => a.y > b.y ? a : b).y
        this.y2y = (val) => val * (this.bottom - this.top) + this.top

        this.y2x = []
        for (let y = this.top; y <= this.bottom; y++) {
            const options = this.ps.filter(p => abs(y - p.y) < 3)
            const left = options.reduce((a, b) => a.x < b.x ? a : b).x
            const right = options.reduce((a, b) => a.x > b.x ? a : b).x
            this.y2x.push([left, right])
        }
        this.readyToStipple = true
    }

    fill(color) {
        if (!this.readyToStipple) this.prepareTransfer()

        // if (color) fill(color)
        // else if (this.pallete) newLayer(choose(this.pallete))
        // else newLayer()
        noStroke()

        let startEndVals = [[0, 1]]
        if (this.cutPos) startEndVals = [[0, this.cutPos], [this.cutPos, 1]]

        startEndVals.forEach(startEnd => {
            const rightSide = []
            const leftSide = []
            for (let i = startEnd[0]; i <= startEnd[1]; i += 0.02) {
                const y = this.y2y(i)
                const xRange = this.getXRange(i)
                rightSide.push(createVector(xRange[1], y))
                leftSide.push(createVector(xRange[0], y))
            }
            leftSide.reverse()

            beginShape()
            // this.ps.forEach(p => curveVertex(this.x + p.x, this.y + p.y))
            rightSide.forEach(p => curveVertex(this.x + p.x, this.y + p.y))
            leftSide.forEach(p => curveVertex(this.x + p.x, this.y + p.y))
            endShape()
        })
    }

    getXRange(v) {
        return this.y2x[round(v * (this.y2x.length - 1))]
    }

    getX(range, randomFunc) {
        return randomFunc(range[0], range[1])
    }

    getRoundPos(yVal, randomFunc) {
        const xRange = this.getXRange(yVal)
        const w = xRange[1] - xRange[0]
        const offset = (xRange[1] + xRange[0]) / 2
        if (!randomFunc) randomFunc = choose(randomFuncs)
        const a = randomFunc(180)
        const pos = getPointOnEllipse(w, w * .4, a)
        pos.x += offset
        pos.y += this.y2y(yVal) + this.y
        return pos
    }

    async stipple(num, times, randomFunc) {
        if (!this.readyToStipple) this.prepareTransfer()

        for (let t = 0; t < times; t++) {
            if (this.pallete) newLayer(choose(this.pallete))
            else newLayer()
            const func = randomFunc ?? choose(randomFuncs)

            for (let i = 0; i < num; i++) {
                const yVal = func()
                const xRange = this.getXRange(yVal)

                let x = this.getX(xRange, func)
                const y = this.y2y(yVal)

                if (allDots % 3000 == 0) await timeout(0);
                drawDotXY(this.x + x, this.y + y)
            }
        }
    }

    async shade(num, val1, val2) {
        this.getX = (range, randomFunc) => addedRandom2(range[0] + (range[1] - range[0]) * val1, range[0] + (range[1] - range[0]) * val2)
        await this.stipple(num, 1)
        this.getX = (range, randomFunc) => randomFunc(range[0], range[1])
    }


    cut(yVal, offset) {
        this.cutPos = yVal
        this.cutOffset = offset
        const yValy = this.y2y(yVal)
        this.y2y = (val) => {
            if (val < yVal) return map(val, 0, yVal, this.top, yValy)
            return offset + map(val, yVal, 1, yValy, this.bottom)
        }

        const topRange = this.getXRange(yVal - 0.1)
        const arcR = (topRange[1] - topRange[0]) / 2
        const y2xTop = round((yVal - 0.1) * (this.y2x.length - 1))
        const y2xBottom = round(yVal * (this.y2x.length - 1))
        for (let i = y2xTop; i <= y2xBottom; i++) {
            const rVal = map(i, y2xTop, y2xBottom, 0, arcR)
            const xRange = this.y2x[i]
            const mid = (xRange[1] + xRange[0]) / 2
            const r = sqrt(arcR ** 2 - rVal ** 2)
            this.y2x[i] = [-r + mid, r + mid]
        }
    }

    farunkel(sum) {
        const r = map(sum,1,50,50,5)
        this.farunkels = []
        for (let i = 0; i < sum; i++) {
            const yVal = random()
            const xRange = this.getXRange(yVal)
            const x = this.getX(xRange, random)
            const y = this.y2y(yVal)
            const f = new RoundShape(this.x+x, this.y+y, r*random(0.5,1))
            this.farunkels.push(f)
        }
    }
}

class RoundShape extends Shape {
    constructor(x, y, r, step) {
        super(x, y)
        this.ps = getEllipse(r, r, step)
    }
    wonky(v) {
        this.ps.forEach(p => p.mult(1 + random(v)))
        return this
    }
    pointy(dir, v = 0.2) {
        let closestD = 1000
        let closestI = -1
        this.ps.forEach((p, i) => {
            const d = abs(p.heading() - dir)
            if (d < closestD) {
                closestD = d
                closestI = i
            }
        })
        this.ps[closestI].y *= 1 + v
        this.ps[closestI].x += fit(50)
        this.ps.splice(closestI, 0, this.ps[closestI])
        this.ps[closestI + 1].x -= fit(50)
        return this
    }
}

class LongShape extends Shape {
    constructor(x, y, l, w, a = 0, bend = 1) {
        super(x, y)
        l = fit(l)
        w = fit(w)
        this.w = w;
        let crv = [
            createVector(random(-bend * l / 3, bend * l / 3), -l),
            createVector(random(-bend * l / 8, bend * l / 8), -l / 2),
            createVector(0, 0)
        ]
        crv.forEach(p => p.rotate(a))
        crv.push(crv[crv.length - 1])
        crv.splice(0, 0, crv[0])

        const newCrv = []
        for (let i = 0; i < crv.length - 3; i++) {
            for (let t = 0; t < 1; t += 0.01) {
                x = curvePoint(crv[i].x, crv[i + 1].x, crv[i + 2].x, crv[i + 3].x, t)
                y = curvePoint(crv[i].y, crv[i + 1].y, crv[i + 2].y, crv[i + 3].y, t)
                newCrv.push(createVector(x, y))
            }
        }
        crv = newCrv
        const side1 = []
        const side2 = []
        for (let i = .1; i < 1; i += 0.1) {
            const indexOnCurve = round(i * (crv.length - 2))
            const p1 = crv[indexOnCurve]
            const p2 = crv[indexOnCurve + 1]
            const dir = p5.Vector.sub(p1, p2)
            dir.rotate(90)
            const wr = map(i, 0, 1, w * .5, w * 1)
            dir.setMag(sin(180 * i) * wr * .8 + wr * .2)
            side1.push(p5.Vector.add(p1, dir))
            side2.push(p5.Vector.sub(p1, dir))
        }
        side2.reverse()
        this.ps = [crv[0], ...side1, crv[crv.length - 1], ...side2]
    }
    wonky(w) {
        this.ps.forEach(p => p.add(w * random(-.5, .5), w * random(-.5, .5)))
        return this
    }
}