function initDenimParams() {
    warpSpacingMinMax = [0.8, 2]
    weftSpacingMinMax = [0.8, 1]

    startOffset = [2, 1, 0]
    patternTop = [2]
    patternBottom = [1]

    if (R.random_dec() < 0.1) {
        startOffset = Array(R.random_int(1, 3)).fill(0).map((a, i) => i)
        patternTop = Array(R.random_int(1, 3)).fill(0).map(a => R.random_int(1, 5))
        patternBottom = Array(R.random_int(1, 3)).fill(0).map(a => R.random_int(1, 5))
    }
}

class Denim {
    constructor(layoutPattern, color, age = 0.5) {
        this.layoutPattern = layoutPattern
        this.color = color
        this.visibleWhite = R.random(0.5, 1)
        this.darkness = R.random(0.3)
        this.noiseScale = R.random(200, 400)
        this.warpExtensions = [8, 25]
        this.extendChance = 0.5
        this.age = age
        this.rotation = 0
        this.ripNoiseZ = R.random(1000)
        this.ripThreshold = R.random(.18, .32)
        this.ripMin = R.random(30, 100) * initialThreadSize
        this.ripMax = R.random(this.ripMin, 200) * initialThreadSize
    }
    rotate(r) {
        this.rotation = r
        return this
    }
    calc(args = {}) {
        if (!this.warp) this.makeWarp()
        if (!this.weft) this.makeWeft()
        if (!args.dontTrim) this.trim()
        // if (!args.dontUnravel) this.unravel()
        // print('unravel',R.useA, R.usage)
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
        const initialOffsetSize = 5*initialThreadSize
        const v1 = pos.copy().add(dir2.copy().setMag(initialOffsetSize).mult(-1))
        const v2 = v1.copy().add(dir1).add()
        const numPoints = 15
        const firstRow = Array(numPoints).fill(0).map((a, i) => p5.Vector.lerp(v1, v2, i / (numPoints - 1)))
        firstRow.forEach(p => p.add(dir2.copy().mult(R.random(-initialOffsetSize, initialOffsetSize))))
        this.warp = [firstRow]
        let addRows = true
        while (addRows) {
            const lastRow = this.warp[this.warp.length - 1]
            const newRow = lastRow.map(p => p.copy())
            newRow.forEach(p => p.add(dir2.copy().mult(threadSize * R.random(warpSpacingMinMax[0], warpSpacingMinMax[1]))))
            this.warp.push(newRow)
            addRows = false
            newRow.forEach((p, i) => {
                if (p5.Vector.dist(p, firstRow[i]) < h) addRows = true
            })
        }
        this.warp = this.warp.map(row => makeCurve(row))
    }
    async drawWarp() {
        let i = 0
        threadSize = initialThreadSize/2
        for (const row of this.warp) {
            const threadColor = lerpColor(color(warpColors[0]), color(warpColors[1]), R.random_dec())
            await thread(row, threadColor, 2)
            if (i++ % 10 == 0) await timeout(0);
        }
    }
    async extendWarps() {
        for (const row of this.warp) {
            if (R.random_dec() < this.extendChance) {
                const dir1 = p5.Vector.sub(row[0], row[1])
                await franzim(row[0], dir1, threadSize * R.random_in(this.warpExtensions))
            }
            if (R.random_dec() < this.extendChance) {
                const dir2 = p5.Vector.sub(row[row.length - 1], row[row.length - 2])
                await franzim(row[row.length - 1], dir2, threadSize * R.random_in(this.warpExtensions))
            }
            await timeout(0);
        }
    }


    // ---------------------------------------------------
    // -------------  W E F T ----------------------------
    // ---------------------------------------------------
    makeWeft() {
        // ------- FULL WEFT
        threadSize = initialThreadSize
        this.weft = [{ column: this.warp.map(row => row[0]), threadSize }]
        const rowLength = crvLength(this.warp.reduce((a, b) => crvLength(a) > crvLength(b) ? a : b))
        for (let i = 0; i < rowLength; i += threadSize * R.random_in(weftSpacingMinMax)) {
            this.weft.push({
                column: this.warp.map(row => placeOnCurve(row, i)).filter(a => a != false),
                threadSize
            })
            threadSize = initialThreadSize * R.random(1, 1.2)
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
        let i = 0
        for (const col of this.weft) {
            for (const loop of col) {
                await loop.draw()
            }
            if (i++ % 10 == 0)
                await timeout(0);
        }
    }
    hasWeftOn(p1) {
        for (const column of this.weft) {
            for (const loop of column) {
                for (const p2 of loop.ps) {
                    if (p2 && p5.Vector.dist(p1, p2) < 5) return loop
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
        this.warp = this.warp.map(row => row.filter(p => 
            p.x >= -baseWidth * .1 && p.x <= baseWidth * 1.1 && p.y >= -baseHeight * .1 && p.y <= baseHeight * 1.1))
    }
    unravel() {
        this.weft.forEach(col => {
            if (col.length > 4) {
                col[0].ps.forEach(p => p.add(threadSize * R.random(-.3, .3), threadSize * R.random(-.3, .3)))
                col[col.length - 1].ps.forEach(p => p.add(threadSize * R.random(-0.3, .3), threadSize * R.random(-.3, .3)))
            }
        })
    }

    // ---------------------------------------------------
    // -------------  R I P S ----------------------------
    // ---------------------------------------------------

    pointInRip(p) {
        return noise(ripNoiseScale[0] * p.x / baseWidth, ripNoiseScale[1] * p.y / baseHeight, this.ripNoiseZ) < this.ripThreshold
    }

    makeRips() {
        this.warpRips = []
        this.weftRips = []
        for (let i = 0; i < this.warp.length; i++) {
            const row = this.warp[i]
            let part = []
            if (row.length==0) continue
            for (let j = 0; j < 200; j++) {
                const rowPoint = row[floor(row.length*j/200)]
                if (this.pointInRip(rowPoint)) {
                    part.push(j)
                } else {
                    if (part.length > 2) {
                        const partIndexes = part.map(stepIndex => floor(stepIndex*row.length/200))
                        const partPoints = partIndexes.map(pindex => row[pindex])
                        const l = crvLength(partPoints)

                        const first = partPoints[0].copy()
                        const second = partPoints[1].copy()
                        const last = partPoints[partPoints.length - 1].copy()
                        const secondToLast = partPoints[partPoints.length - 2].copy()
                        if (l > this.ripMin && l < this.ripMax) {
                            let newPs = []
                            for (let h = 0; h <= 5; h++)
                                newPs.push(p5.Vector.lerp(first, last, h / 5).add(0, R.random(-2, 4)))
                            newPs = makeCurve(newPs)
                            row.splice(partIndexes[0], partIndexes[partIndexes.length-1] -  partIndexes[0], ...newPs)
                        }
                        if (l > this.ripMax) {
                            // if (R.random_bool(1)) {
                                this.warpRips.push({
                                    pos: first,
                                    dir: p5.Vector.sub(second, first),
                                    len: l * R.random(0,0.5)
                                })
                                this.warpRips.push({
                                    pos: last,
                                    dir: p5.Vector.sub(secondToLast, last),
                                    len: l * R.random(0,0.5)
                                })
                            // }
                            row.splice(partIndexes[0], partIndexes[partIndexes.length-1] -  partIndexes[0])
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
                    pos: loop.ps.filter(a => a != null)[0],
                    dir: waitForRip ? loop.dir().mult(-1) : loop.dir()
                })
                waitForRip = !waitForRip
            }
        }))


        this.weft.forEach(col => col.forEach(loop => loop.ps = loop.ps.filter(p => !this.pointInRip(p))))
        this.hasRips = true
        return this
    }

    async drawRips() {
        let i = 0
        for (const rip of this.warpRips) {
            await franzim(rip.pos, rip.dir, rip.len)
            if (i++ % 10 == 0)
                await timeout(0);
        }

        let counter = 0
        this.weftRips = this.weftRips.filter(a => R.random_dec() < 0.7)
        for (const end of this.weftRips) {
            let c = color(this.color)
            this.weft.forEach(col => col.forEach(loop => loop.ps.forEach(p => {
                if (p && p5.Vector.dist(p, end.pos) < 10)
                    c = loop.color
            })))
            c.setAlpha(50)

            if (R.random_dec() < 0.5) {
                stroke(c)
                for (let a = 0; a < R.random(1,5); a++) {
                    await tinyThread(end.pos.copy().mult(globalScale), R.random(3, 10))
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
                const l = R.random(2, 5)
                for (let i = 0; i < l; i++) {
                    dir.rotate(R.random(-25, 25))
                    ps.push(ps[ps.length - 1].copy().add(dir))
                }
                // ps = makeCurve(ps)
                await thread(ps, c, 5)
            }
            if (counter++ % 30 == 0) await timeout(0);
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
                const val = 1 - dist(p.x, p.y, baseWidth / 2, baseHeight / 2) / (baseHeight / 2)
                col[i].age = val * this.age / 2
                col[i].yellow = val * this.age / 2
            }
        })
    }

    dropShadowOn(denims) {
        const shading = createGraphics(baseWidth, baseHeight)
        shading.noStroke()
        shading.fill(0, 10)
        this.weft.forEach(loop => {
            loop.forEach(p => {
                shading.circle(p.x + 10, p.y + 10, threadSize * R.random(10))
            })
        })
        for (const denim of denims) {
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
        // for (const denim of denims)
        // this.layoutPattern.dropShadowOn(denim)
    }

    foldedStitchings(pattern) {
        print('foldedStitchings')
        if (!pattern) pattern = this.layoutPattern

        const gh = createGraphics(baseWidth, baseHeight)
        gh.noStroke()
        const newPattern = new LayoutPattern2(pattern.ps)

        const stitchPlaces = random()<0.5 ? [15] : [7,35]

        gh.fill(255, 100)
        newPattern.ps = pattern.getOffset(0)
        newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, R.random(6) * initialThreadSize))
        gh.fill(255, 20)
        for (const stitchPlace of stitchPlaces) {
            newPattern.ps = pattern.getOffset(stitchPlace + 5)
            newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, R.random(6) * initialThreadSize))
        }

        gh.fill(0, 20)
        for (const stitchPlace of stitchPlaces) {
            newPattern.ps = pattern.getOffset(stitchPlace)
            newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, R.random(9)) * initialThreadSize)
        }
        // gh.fill(120, 10)
        // for (const stitchPlace of stitchPlaces) {
        //     newPattern.ps = pattern.getOffset(stitchPlace)
        //     newPattern.getCurve().forEach(p => gh.circle(p.x, p.y, R.random(9) * initialThreadSize))
        // }

        for (let i=0; i<stitchPlaces.length; i++) {
            newPattern.ps = pattern.getOffset(stitchPlaces[i]-15)
            newPattern.getCurve().forEach((p, i) => {
                const s = (sin(i * 8) + 1) / 2
                gh.fill(255 * s, 7)
                gh.circle(p.x, p.y, R.random(5, 25) * initialThreadSize)
            })
        }

        this.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    const c = gh.get(p.x, p.y)
                    if (alpha(c) > 0) {
                        loop.age = (brightness(c) / 360) * (alpha(c) / 255)
                        if (loop.yellow) loop.yellow = 0
                        loop.darkness = 0.25 - (brightness(c) / 360) * (alpha(c) / 255) / 4
                    }
                }
            })
        })
        pattern.setStitches(stitchTypes.DOUBLE, stitchPlaces)
        return this
    }

    async drawBehind() {
        // const behind = new Denim(this.layoutPattern, this.color, 0).rotate(this.rotation - 180)
        // behind.visibleWhite = 1
        // behind.darkness = 0
        // behind.pointInRip = (p) => !this.pointInRip(p)
        // behind.calc()
        // await behind.draw({ dontFringe: true })
    }
}