const DRAW_WARP = true
const warpSpacingMinMax = [0.8, 1.5]
const weftSpacingMinMax = [0.8, 1]

const startOffset = [2, 1, 0]//Array(round_random(1,3)).fill(0).map((a,i)=>i)             // [0,1,2]
const patternTop = [2]//Array(round_random(1,3)).fill(0).map(a=>round_random(1,5))      // [2]
const patternBottom = [1] //Array(round_random(1,3)).fill(0).map(a=>round_random(1,15))    // [1]

class Denim {
    constructor(layoutPattern, color, age=0.5) {
        this.layoutPattern = layoutPattern
        this.color = color
        this.visibleWhite = 0.5
        this.darkness = 0.6
        this.noiseScale = random(200, 400)
        this.warpExtensions = [5, 15]
        this.age = age
        this.rotation = 0
        this.ripNoiseZ = random(1000)
    }
    rotate(r) {
        this.rotation = r
        return this
    }
    calc(args = {}) {
        if (!this.warp) this.makeWarp()
        if (!this.weft) this.makeWeft()
        if (!args.dontTrim) this.trim()
        if (!args.dontUnravel) this.unravel()
        if (!args.dontAge) this.doAge()
        return this
    }
    async draw(args = {}) {
        threadSize = initialThreadSize
        if (args.withBehind) await this.drawBehind()
        if (!args.dontWarp) await this.drawWarp()
        if (!args.dontWeft) await this.drawWeft()
        if (!args.dontFringe) await this.extendWarps()
        if (this.hasRips) await this.drawRips()
        if (!args.dontStitch) await this.layoutPattern.drawStitches(this)
    }


    // ---------------------------------------------------
    // -------------  W A R P ----------------------------
    // ---------------------------------------------------
    makeWarp() {
        const containingSquare = this.layoutPattern.rotatedContainingSquare(this.rotation)
        const { pos, w, h, rotation } = containingSquare.getDimension()
        const dir1 = p5.Vector.fromAngle(radians(rotation)).setMag(w)
        const dir2 = dir1.copy().rotate(PI / 2).normalize()
        const initialOffsetSize = 5
        const v1 = pos.copy().add(dir2.copy().mult(-initialOffsetSize))
        const v2 = v1.copy().add(dir1).add()
        const numPoints = 15
        const firstRow = Array(numPoints).fill(0).map((a, i) => p5.Vector.lerp(v1, v2, i / (numPoints - 1)))
        firstRow.forEach(p => p.add(dir2.copy().mult(random(-initialOffsetSize, initialOffsetSize))))
        this.warp = [firstRow]
        let addRows = true
        while (addRows) {
            const lastRow = this.warp[this.warp.length - 1]
            const newRow = lastRow.map(p => p.copy())
            newRow.forEach(p => p.add(dir2.copy().mult(threadSize * random(warpSpacingMinMax[0], warpSpacingMinMax[1]))))
            this.warp.push(newRow)
            addRows = false
            newRow.forEach((p, i) => {
                if (p5.Vector.dist(p, firstRow[i]) < h) addRows = true
            })
        }
        this.warp = this.warp.map(row => makeCurve(row))
    }
    async drawWarp() {
        for (const row of this.warp) {
            const threadColor = lerpColor(color(warpColors[0]), color(warpColors[1]), random())
            await thread(row, threadColor, 3)
            await timeout(0);
        }
    }
    async extendWarps() {
        for (const row of this.warp) {
            if (random() < 0.5) {
                const dir1 = p5.Vector.sub(row[0], row[1])
                await franzim(row[0], dir1, threadSize * random_in(this.warpExtensions))
            }
            if (random() < 0.5) {
                const dir2 = p5.Vector.sub(row[row.length - 1], row[row.length - 2])
                await franzim(row[row.length - 1], dir2, threadSize * random_in(this.warpExtensions))
            }
            await timeout(0);
        }
    }


    // ---------------------------------------------------
    // -------------  W E F T ----------------------------
    // ---------------------------------------------------
    makeWeft() {
        // ------- FULL WEFT
        this.weft = [{ column: this.warp.map(row => row[0]), threadSize }]
        const rowLength = crvLength(this.warp.reduce((a, b) => crvLength(a) > crvLength(b) ? a : b))
        for (let i = 0; i < rowLength; i += threadSize * random_in(weftSpacingMinMax)) {
            this.weft.push({ 
                column: this.warp.map(row => placeOnCurve(row, i)).filter(a=>a!=false), 
                threadSize })
            threadSize = initialThreadSize * random(1, 1.2)
        }
        
        // ----- TWILL
        const threadColor = color(this.color)
        const brightColor = lerpColor(threadColor, color(255), this.visibleWhite)

        this.weft = this.weft.map(col => {
            const loops = []
            const threadColors = [threadColor, brightColor]
            for (let i = 0; i < startOffset[0] - 1; i++) threadColors.rotate()

            for (let y = startOffset.rotate(); y < col.column.length; y += patternBottom.rotate()) {
                let loop = col.column.slice(y, y + patternTop.rotate() + 1)
                y += patternTop[0]
                let loopColor = threadColors.rotate()
                loopColor = lerpColor(loopColor, color(0), noise(loop[0].x / this.noiseScale, loop[0].y / this.noiseScale) * this.darkness)
                loops.push(new Loop(loop, loopColor, col.threadSize))
            }
            return loops
        })
    }
    async drawWeft() {
        for (const col of this.weft) {
            for (const loop of col) {
                await loop.draw()
            }
            await timeout(0);
        }
        print(t1)
    }
    hasWeftOn(p1) {
        for (const column of this.weft) {
            for (const loop of column) {
                for (const p2 of loop.ps) {
                    if (p2 && p5.Vector.dist(p1, p2) < 2) return loop
                }
            }
        }
        return false
    }

    // ---------------------------------------------------
    // -------------  E D I T ----------------------------
    // ---------------------------------------------------
    trim() {
        this.warp = this.warp.map(row => row.filter(p => this.layoutPattern.pointInPattern(p)))
        this.warp = this.warp.filter(row => row.length > 1)
        this.weft = this.weft.map(col => col.filter(loop => loop.ps.filter(p => this.layoutPattern.pointInPattern(p)).length > 1))
    }
    unravel() {
        this.weft.forEach(col => {
            if (col.length > 4) {
                col[0].ps.forEach(p => p.add(threadSize * random(-.3, .3), threadSize * random(-.3, .3)))
                col[col.length - 1].ps.forEach(p => p.add(threadSize * random(-0.3, .3), threadSize * random(-.3, .3)))
            }
        })
    }

    // ---------------------------------------------------
    // -------------  R I P S ----------------------------
    // ---------------------------------------------------

    pointInRip(p){
        return noise(ripNoiseScale[0] * p.x / width, ripNoiseScale[1] * p.y / height, this.ripNoiseZ) < 0.3
    }

    makeRips() {
        this.warpRips = []
        this.weftRips = []

        const noiseZ = random(1000)
        for (let i = 0; i < this.warp.length; i++) {
            const row = this.warp[i]
            let part = []
            for (let j = 0; j < row.length; j++) {
                if (this.pointInRip(row[j])) {
                    part.push(j)
                } else {
                    if (part.length > 2) {
                        const partCrv = part.map(p => row[p])
                        const l = crvLength(partCrv)
                        if (l > 50) {
                            const p1 = row[part[0]]
                            const p2 = row[part[part.length - 1]]
                            let newPs = []
                            for (let h = 0; h <= 5; h++)
                                newPs.push(p5.Vector.lerp(p1, p2, h / 5).add(0, random(-2, 4)))
                            newPs = makeCurve(newPs)
                            row.splice(part[0], part.length, ...newPs)
                        }
                        if (l > 90) {
                            if (random() < 1) {
                                this.warpRips.push({
                                    pos: row[part[0]],
                                    dir: p5.Vector.sub(row[part[1]], row[part[0]]),
                                    len: l * random(0.5)
                                })
                                this.warpRips.push({
                                    pos: row[part[part.length - 1]],
                                    dir: p5.Vector.sub(row[part[part.length - 2]], row[part[part.length - 1]]),
                                    len: l * random(0.5)
                                })
                            }
                            row.splice(part[0], part.length)
                        }
                    }
                    part = []
                }
            }
        }

        let waitForRip = true
        this.weft.forEach(col => col.forEach((loop, loopIndex) => {
            const inHole = loop.ps.filter(p => !this.pointInRip(p)).length > 0
            if ((inHole && waitForRip) || (!inHole && !waitForRip)) {
                this.weftRips.push({
                    pos: loop.ps.filter(a=>a!=null)[0],
                    dir: waitForRip ? loop.dir().mult(-1) : loop.dir()
                })
                waitForRip = !waitForRip
            }
        }))

        this.weft.forEach(col => col.forEach(loop => loop.ps = loop.ps.filter(p => !this.pointInRip(p) )))
        this.hasRips = true
        return this
    }

    async drawRips() {
        for (const rip of this.warpRips) {
            await franzim(rip.pos, rip.dir, rip.len)
            await timeout(0);
        }

        let counter=0
        for (const end of this.weftRips) {
            let c = color(this.color)
            this.weft.forEach(col => col.forEach(loop => loop.ps.forEach(p => {
                if (p && p5.Vector.dist(p, end.pos) < 10)
                    c = loop.color
            })))
            c.setAlpha(50)

            if (random() < 0.5) {
                stroke(c)
                for (let a = 0; a < random(5, 15); a++) {
                    await tinyThread(end.pos, c, random(3,10))
                    // const start = end.pos.copy()
                    // const dir = p5.Vector.random2D()
                    // for (let i = 0; i < random(5, 80); i++) {
                    //     start.add(dir)
                    //     dir.rotate(random(-5, 5))
                    //     await drawDot(start)
                    // }
                }
            } else {
                let ps = [end.pos]
                const dir = end.dir.setMag(3)
                const l = random(2,5)
                for (let i = 0; i < l; i++) {
                    dir.rotate(random(-25, 25))
                    ps.push(ps[ps.length - 1].copy().add(dir))
                }
                // ps = makeCurve(ps)
                await thread(ps, c, 5)
            }
            if (counter++ %100==0) await timeout(0);
        }

        // fill(0)
        // this.weftRips.forEach(p=>circle(p.x,p.y,5))
    }

    // ---------------------------------------------------
    // -------------  C O L O R --------------------------
    // ---------------------------------------------------


    doAge() {
        const midWeft = floor(this.weft.length / 2)
        this.weft.forEach((col, colI) => {
            for (let i = 0; i < col.length; i++) {
                const p = col[i].ps[0]
                const val = 1 - dist(p.x, p.y, width / 2, height / 2) / (height / 2)
                col[i].age = val * this.age
            }
        })
    }

    dropShadowOn(denims) {
        for (const denim of denims)
            this.layoutPattern.dropShadowOn(denim)
    }

    foldedStitchings() {
        const gh = createGraphics(width, height)
        gh.noStroke()
        const newPattern = new LayoutPattern2(this.layoutPattern.ps)

        gh.fill(255, 100)
        newPattern.ps = this.layoutPattern.getOffset(0)
        newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, random(6) * initialThreadSize))
        gh.fill(255, 30)
        newPattern.ps = this.layoutPattern.getOffset(45)
        newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, random(6) * initialThreadSize))

        gh.fill(0, 30)
        newPattern.ps = this.layoutPattern.getOffset(7)
        newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, random(9)) * initialThreadSize)
        newPattern.ps = this.layoutPattern.getOffset(40)
        newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, random(9) * initialThreadSize))

        newPattern.ps = this.layoutPattern.getOffset(22)
        newPattern.getCurve().forEach((p, i) => {
            const s = (sin(i * 8) + 1) / 2
            gh.fill(255 * s, 15)
            gh.circle(p.x, p.y, random(5, 25) * initialThreadSize)
        })

        this.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    const c = gh.get(p.x, p.y)
                    if (alpha(c) > 0) {
                        loop.age = (brightness(c) / 360) * (alpha(c) / 255)
                        loop.darkness = 0.25 - (brightness(c) / 360) * (alpha(c) / 255) / 4
                    }
                }
            })
        })
        this.layoutPattern.setStitches(stitchTypes.DOUBLE, [7, 40])
        return this
    }

    async drawBehind(){
        const behind = new Denim(this.layoutPattern,this.color,0).rotate(this.rotation-180)
        behind.visibleWhite = 1
        behind.darkness = 0
        behind.pointInRip = (p)=>!this.pointInRip(p)
        behind.calc()
        await behind.draw({ dontFringe:true })
    }
}