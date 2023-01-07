warpSpacingMinMax = [0.8, 2]
weftSpacingMinMax = [0.8, 1]

startOffset = [2, 1, 0]
patternTop = [2]
patternBottom = [1]

class Denim {
    constructor(lp, color, age = 0.5) {
        this.lp = lp
        this.color = color
        this.visibleWhite = R.random(0.5, 1)
        this.darkness = R.random(0.3)
        this.noiseScale = R.random(200, 400)
        this.warpExtensions = [15, 40]
        this.extendChance = 0.5
        this.age = age
        this.rotation = 0
        this.ripNoiseZ = R.random(1000)
        this.ripThreshold = R.random(.18, .25)
        this.ripMin = R.random(50, 100) * initialThreadSize
        this.ripMax = R.random(this.ripMin, 160) * initialThreadSize
        this.ripExtendMasks = []
    }
    rotate(r) {
        this.rotation = r
        return this
    }
    calc() {
        this.ripThreshold += globalAge * 0.3
        this.age += globalAge
        this.ripMin -= globalAge * 30
        this.ripMax -= globalAge * 70
        if (!this.warp) this.makeWarp()
        if (!this.weft) this.makeWeft()

        // console.time('trim')
        this.trim()
        // console.timeEnd('trim')

        // this.unravel()

        // this.doAge()
        return this
    }
    async draw(args = {}) {
        threadSize = initialThreadSize
        await this.drawWarp()
        await this.drawWeft(args.colorFunc)
        await this.lp.drawStitches(this)
        if (!args.dontFringe) await this.extendWarps()
    }
    async finishDraw() {
        if (this.hasRips) await this.drawRips()
    }


    // ---------------------------------------------------
    // -------------  W A R P ----------------------------
    // ---------------------------------------------------
    makeWarp() {
        const containingSquare = this.lp.rotatedContainingSquare(this.rotation)
        const { pos, w, h, rotation } = containingSquare.getDimension()
        const dir1 = p5.Vector.fromAngle(radians(rotation)).setMag(w)
        const dir2 = dir1.copy().rotate(PI / 2).normalize()
        const initialOffsetSize = 5 * initialThreadSize
        const v1 = pos.copy().add(dir2.copy().setMag(initialOffsetSize).mult(-1))
        const v2 = v1.copy().add(dir1).add()
        const numPoints = 15
        const firstRow = Array(numPoints).fill(0).map((a, i) => vlerp(v1, v2, i / (numPoints - 1)))
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
                if (vdist(p, firstRow[i]) < h) addRows = true
            })
        }
        this.warp = this.warp.map(row => toCrv(row))
    }
    async drawWarp() {
        let i = 0
        threadSize = initialThreadSize / 2
        for (const row of this.warp) {
            const threadColor = lerpColor(color(warpColors[0]), color(warpColors[1]), R.random_dec())
            await thread(row, threadColor, 5)
            if (i++ % 10 == 0) await timeout(0);
        }
    }
    async extendWarps() {
        for (const row of this.warp) {
            if (R.random_dec() < this.extendChance) {
                const dir1 = vsub(row[0], row[1])
                await franzim(row[0], dir1, threadSize * R.random_in(this.warpExtensions))
            }
            if (R.random_dec() < this.extendChance) {
                const dir2 = vsub(row[row.length - 1], row[row.length - 2])
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
        const crawlers = this.warp.map(row => new curveCrawler(row))
        for (let i = 0; i < rowLength; i += threadSize * R.random_in(weftSpacingMinMax)) {
            this.weft.push({
                // column: this.warp.map(row => placeOnCurve(row, i)).filter(a => a != false),
                column: crawlers.map(crawler => crawler.findPlace(i)).filter(a => a != false),
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

    async drawWeft(colorFunc) {
        let i = 0
        for (const col of this.weft) {
            for (const loop of col) {
                loop.applyColorFunc(colorFunc)
                await loop.draw()
            }
            if (i++ % 10 == 0) await timeout(0);
        }
    }
    hasWeftOn(p1) {
        for (const column of this.weft) {
            for (const loop of column) {
                for (const p2 of loop.ps) {
                    if (p2 && vdist(p1, p2) < 5) return loop
                }
            }
        }
        return false
    }

    // ---------------------------------------------------
    // -------------  E D I T ----------------------------
    // ---------------------------------------------------
    trim() {
        this.warp = this.warp.map(row => row.filter(p => this.lp.pointInPattern(p)))
        this.warp = this.warp.filter(row => row.length > 1)
        this.weft = this.weft.map(col => col.filter(loop => loop.ps.filter(p => this.lp.pointInPattern(p)).length > 1))
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
            if (row.length == 0) continue
            for (let j = 0; j < 200; j++) {
                const rowPoint = row[floor(row.length * j / 200)]
                if (this.pointInRip(rowPoint)) {
                    part.push(j)
                } else {
                    if (part.length > 2) {
                        const partIndexes = part.map(stepIndex => floor(stepIndex * row.length / 200))
                        const partPoints = partIndexes.map(pindex => row[pindex])
                        const l = crvLength(partPoints)

                        const first = partPoints[0].copy()
                        const second = partPoints[1].copy()
                        const last = partPoints[partPoints.length - 1].copy()
                        const secondToLast = partPoints[partPoints.length - 2].copy()
                        const dir1 = vsub(first, second).rotate(90)
                        if (l > this.ripMin && l < this.ripMax) {
                            let newPs = []
                            const sumPoints = ceil(l / 10)
                            for (let h = 0; h <= sumPoints; h++) {
                                const newPos = vlerp(first, last, h / sumPoints)
                                const offset = noise(newPos.x / 50, newPos.y / 50) * 40 - 20
                                newPs.push(newPos.add(dir1.copy().setMag(offset)))
                            }
                            newPs = toCrv(newPs)
                            row.splice(partIndexes[0], partIndexes[partIndexes.length - 1] - partIndexes[0], ...newPs)
                        }
                        if (l > this.ripMax) {
                            this.warpRips.push({
                                pos: first,
                                dir: vsub(second, first),
                                len: l * R.random(0.1, 0.5)
                            })
                            this.warpRips.push({
                                pos: last,
                                dir: vsub(secondToLast, last),
                                len: l * R.random(0.1, 0.5)
                            })
                            row.splice(partIndexes[0], partIndexes[partIndexes.length - 1] - partIndexes[0])
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
                let pos = loop.ps.filter(a => a != null)[0]
                let dir = vsub(loop.ps[1], loop.ps[0])
                if (inHole) pos.add(dir)
                else pos.sub(dir)
                this.weftRips.push({
                    // pos: loop.ps.filter(a => a != null)[0],
                    pos,
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
            await franzim(rip.pos, rip.dir, rip.len, .6)
            if (i++ % 10 == 0)
                await timeout(0);
        }

        threadSize = initialThreadSize
        let counter = 0
        this.weftRips = this.weftRips.filter(a => R.random_dec() < 0.7)
        for (const end of this.weftRips) {
            let skip = false
            for (const ripMask of this.ripExtendMasks) {
                if (ripMask.hasWeftOn(end.pos)) skip = true
            }
            if (skip) continue
            let c = color(this.color)
            this.weft.forEach(col => col.forEach(loop => loop.ps.forEach(p => {
                if (p && vdist(p, end.pos) < 10)
                    c = loop.getFinalColor()
            })))
            c.setAlpha(50)

            let ps = [end.pos.copy(), end.pos.copy()]
            const tl = R.random_int(1, 4)
            for (let l = 1; l < 4; l++) {
                const dir = end.dir.setMag(4 * globalScale)
                for (let i = 0; i < l * tl; i++) {
                    dir.rotate(R.random(-35, 35))
                    ps.push(ps[ps.length - 1].copy().add(dir))
                }
                await thread(ps, c, 10, 20)

                if (counter++ % 30 == 0) await timeout(0);
            }
        }
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
        for (const denim of denims)
            this.lp.dropShadowOn(denim)
    }

    foldedStitchings() {
        const pattern = this.lp

        const gh = createGraphics(baseWidth, baseHeight)
        gh.noStroke()
        const newPattern = new LayoutPattern2(pattern.ps)

        gh.fill(0, 20)
        newPattern.crv().forEach(p => gh.circle(p.x, p.y, R.random(10) * initialThreadSize))

        if (pattern.stitchPlaces.length == 2) {
            let sVal = 0
            newPattern.ps = pattern.getOffset(18)
            newPattern.crv().forEach((p, i) => {
                sVal += R.random(15)
                const s = (sin(sVal) + 1) / 2
                // const s = (sin(i * 2 / globalScale) + 1) / 2
                gh.fill(150 * s, 100)
                gh.circle(p.x, p.y, R.random(4, 25) * initialThreadSize)
            })
        }

        gh.fill(0, 20)
        for (const stitchPlace of pattern.stitchPlaces) {
            newPattern.ps = pattern.getOffset(stitchPlace)
            newPattern.crv().forEach(p => gh.circle(p.x, p.y, R.random(7)) * initialThreadSize)
        }



        this.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    const c = gh.get(p.x, p.y)
                    if (alpha(c) > 0) {
                        loop.age = (brightness(c) / 360) * (alpha(c) / 255)
                        if (loop.yellow) loop.yellow = 0
                        loop.darkness = .4 - (brightness(c) / 360) * (alpha(c) / 255) * .4
                    }
                }
            })
        })
        pattern.withStitches = true
        return this
    }
}