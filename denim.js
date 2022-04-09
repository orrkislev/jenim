class Denim {
    constructor(layoutPattern, colors) {
        this.layoutPattern = layoutPattern
        this.colors = colors
        this.rotation = 0
        this.holeGraphics = createGraphics(width, height)
        this.visibleWhite = 0.6
        this.darkness = 0.6
        this.drawBorderShadows = false
        this.noiseScale = random(300, 700)
        this.shadowPatterns = []
    }
    setShadow(pattern){
        pattern = pattern.offset(-100)
        const dims = pattern.getDimension()
        const x = dims.pos.x
        const y = dims.pos.y
        this.shadowPatterns.push({x,y,pattern})
    }
    async draw() {
        await this.drawWarp()
        await this.drawWeft()
    }
    rotate(r) {
        this.rotation = r
    }
    startDraw() {
        const dims = this.layoutPattern.getDimension()
        this.x = dims.pos.x
        this.y = dims.pos.y
        this.w = dims.size.x
        this.h = dims.size.y

        this.lastTransform = drawingContext.getTransform()
        resetMatrix()
        translate(this.x + this.w / 2, this.y + this.h / 2)
        rotate(this.rotation)
        translate(-this.w / 2, -this.h / 2)
    }
    endDraw() {
        drawingContext.setTransform(this.lastTransform)
    }
    makeHole() {
        // this.holeGraphics.noStroke()
        // const p1 = v(width * .1, height * .5)
        // const sliceDir = 5
        // const l = height * .8
        // const p3 = p1.copy().add(p5.Vector.fromAngle(radians(sliceDir)).setMag(l * random(0.8, 1.2)))
        // const p2 = p5.Vector.add(p1, p3).div(2).add(p5.Vector.fromAngle(radians(sliceDir + 90)).mult(random(-20, 20)))
        // let crv = makeCurve([p1, p2, p3])
        // const cutWidth = initialThreadSize * 10

        // let dir;
        // crv = crv.map((p, i) => {
        //     if (i < crv.length - 1) dir = p5.Vector.sub(crv[i + 1], p).heading() + 90
        //     const s = sin(180 * i / crv.length) * cutWidth
        //     return { pos: p, dir: dir, s: s }
        // })

        // this.holeGraphics.fill(0)
        // crv.forEach(p => {
        //     this.holeGraphics.circle(p.pos.x, p.pos.y, p.s)
        // })

        let ps = getEllipse(this.w * 0.6, this.h * 0.6, 45)
        ps.forEach(p => p.mult(random(0.7, 1.3)))
        ps.forEach(p => p.add(this.w / 2, this.h / 2))
        ps = [...ps, ps[0], ps[1], ps[2]]
        this.holeGraphics.beginShape()
        ps.forEach(p => this.holeGraphics.curveVertex(p.x, p.y))
        this.holeGraphics.endShape()
        this.holeEnds = []
        image(this.holeGraphics,0,0)
    }
    pointInHole(p) {
        return alpha(this.holeGraphics.get(p.x, p.y)) > 0
    }
    colorFunc(clr, x, y) {
        return clr
    }
    makeWarp() {
        this.warp = [[]]
        const numPoints = 4
        for (let i = 0; i <= numPoints; i++) this.warp[0].push(v(this.w * i / numPoints, 0))
        while (this.warp[this.warp.length - 1].filter(p => p.y < this.h).length > 0) {
            const ps = this.warp[this.warp.length - 1].map(p => p.copy().add(0, threadSize * random(0.8, 2)))
            this.warp.push(ps)
        }
        this.warp = this.warp.map(w => makeCurve(w))
    }
    async drawWarp() {
        this.startDraw()

        this.makeWarp()
        // for (let i = 0; i < this.warp.length; i++) {
        //     const threadColor = lerpColor(color(warpColors[0]), color(warpColors[1]), random())
        //     let string = []
        //     for (let j = 0; j < this.warp[i].length; j++) {
        //         const p = this.warp[i][j]
        //         if (this.pointInHole(p)) {
        //             if (string.length > 0) {
        //                 await this.drawThread(string, threadColor)
        //                 string = []
        //             }
        //         } else {
        //             string.push(p.copy())
        //         }
        //     }
        //     await this.drawThread(string, threadColor)
        // }
        this.endDraw()
    }
    getPosOnWarp(row, d) {
        let i = floor(d * (this.w / this.warp[row].length))
        i = constrain(i, 0, this.warp[row].length - 1)
        return this.warp[row][i]
    }
    async drawWeft() {
        this.startDraw()
        const color1 = color(this.colors[0])
        const color2 = color(this.colors[1])
        const color3 = lerpColor(color1, color(0), 0.7)
        const startOffset = [0, 1, 2]
        const patternTop = [4]
        const patternBottom = [2]


        for (let x = 0; x < this.w; x += threadSize * random(0.8, 1.1)) {
            startOffset.push(startOffset.shift())
            const threadColor = lerpColor(color1, color2, random())
            const brightColor = lerpColor(threadColor, color(255), this.visibleWhite)
            let colorCount = startOffset[0]
            for (let y = startOffset[0]; y < this.warp.length; y += patternBottom[0]) {
                patternTop.push(patternTop.shift())
                patternBottom.push(patternBottom.shift())

                if (y + patternTop[0] > this.warp.length - 1) break
                colorCount++

                const threadPs = []
                for (let t = 0; t < patternTop[0] + 1; t++) threadPs.push(this.getPosOnWarp(y + t, x).copy())
                y += patternTop[0]
                threadPs[0].y -= threadSize / 2
                threadPs[threadPs.length - 1].y += threadSize / 2

                const closeToHolePoints = threadPs.filter(p => alpha(this.holeGraphics.get(p.x, p.y)) > 0)
                if (closeToHolePoints.length == threadPs.length) continue

                if (closeToHolePoints.length > 0 && random() > 0.5) continue

                closeToHolePoints.forEach(p => this.holeEnds.push(p.copy()))

                let stitchColor = (colorCount % 2 == 0) ? threadColor : brightColor
                // stitchColor = this.colorFunc(stitchColor, threadPs[0].x, threadPs[0].y)
                // stitchColor = lerpColor(stitchColor, color3, noise(threadPs[0].x / this.noiseScale, threadPs[0].y / this.noiseScale) * this.darkness)

                // if (this.drawBorderShadows == true){
                //     const borderDist = this.layoutPattern.distToBorder(threadPs[0])
                //     if (borderDist < threadSize*4) {
                //         const x = map(borderDist, 4, 0, 0.5, .8)
                //         stitchColor = lerpColor(stitchColor, color(255), x)
                //     } else if (borderDist < threadSize*10) {
                //         const x = map(borderDist, 10, 0, 0.2, .8)
                //         stitchColor = lerpColor(stitchColor, color3, x)
                //     } else if (borderDist < threadSize*60) {
                //         const x = map(borderDist, 60, 30, 0.5, 1)
                //         stitchColor = lerpColor(stitchColor, color3, noise(threadPs[0].x / 5, threadPs[0].y / 100) * x)
                //     }
                // }

                // this.shadowPatterns.forEach(shadowPattern=>{
                //     if (shadowPattern.pattern.pointInPattern(threadPs[0].copy().sub(shadowPattern.x,shadowPattern.y))) 
                //         stitchColor = lerpColor(stitchColor,color(0), 0.7) 
                // })

                await this.drawThread(threadPs, stitchColor)

                threadSize = initialThreadSize * random(1, 1.2)
            }
        }
        this.endDraw()
    }

    async drawThread(threadPs, stitchColor) {
        if (this.layoutPattern)
            threadPs = threadPs.filter(p => this.layoutPattern.pointInPattern(p))
        await thread(threadPs, stitchColor)
    }

    async drawHoleStuff() {
        this.startDraw()

        const strings = []
        for (let i = 0; i < this.warp.length; i += 2) {
            let startString = null
            this.warp[i].forEach((p, j) => {
                if (!startString && alpha(this.holeGraphics.get(p.x, p.y)) > 0) startString = this.warp[i][j - 2].copy()
                if (startString && alpha(this.holeGraphics.get(p.x, p.y)) == 0) {
                    if (p.dist(startString) > 30) {
                        const endString = this.warp[i][j + 2].copy()
                        strings.push([startString, endString])
                    }
                    startString = null
                }
            })
        }

        for (const string of strings) {
            const ps = []
            for (let i = 1; i < 5; i++) ps.push(p5.Vector.lerp(string[0], string[1], i / 5))
            ps.forEach(p => p.add(0, threadSize * random(-1, 1)))
            await thread([string[0], ...ps, string[1]], color(choose(warpColors)))
        }

        const whiteColor = color(255)
        for (let i = 0; i < this.holeEnds.length; i++) {
            const holeEnd = this.holeEnds[i]
            for (let j = 0; j < 50; j++) {
                let c = color(choose(this.colors))
                c = lerpColor(c, whiteColor, random(0, 1))
                // c = lerpColor(c, color(0), noise(holeEnd.x / 250, holeEnd.y / 500) * this.darkness)
                c.setAlpha(100)
                stroke(c)
                const p = holeEnd.copy().add(threadSize * random(-1, 1), threadSize * random(-1, 1))
                const d = p5.Vector.sub(v(width / 2, height / 2), p).normalize().rotate(random(-90, 90))
                for (let t = 0; t < random(10, 60); t++) {
                    d.rotate(random(-10, 10))
                    p.add(d)
                    await drawDot(p)
                }
            }
        }
        this.endDraw()
    }
}





async function thread(ps, clr, ) {
    noFill()
    noStroke()

    const crv = makeCurve(ps)
    fill(clr)
    crv.forEach(p => circle(p.x, p.y, 5))

    noStroke()
    clr.setAlpha(80)
    fill(clr)
    const currTransform = drawingContext.getTransform()
    for (let i = 0; i < crv.length - 1; i++) {
        const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
        translate(crv[i].x, crv[i].y)
        rotate(dir)
        ellipse(0, 0, threadSize * 0.9, threadSize * 0.54)
        drawingContext.setTransform(currTransform)
    }

    strokeWeight(1)
    const arcPs = getEllipse(threadSize, threadSize, 45, 180, 360)
    arcPs.forEach(p => p.y *= 0.6)
    const twistK = random(-0.2, 0.2)
    for (let i = 0; i < crv.length - 1; i++) {
        const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
        const newPs = arcPs.map(p => p.copy())
        newPs.forEach(p => p.y *= map(i, 0, crv.length, -1, 1))
        newPs.forEach(p => p.rotate(dir))
        newPs.forEach(p => p.add(crv[i]))
        for (let pIndex = 0; pIndex < newPs.length; pIndex++) {
            let val = getShadeAtVal(shade_round, i / crv.length) * 150
            val += getShadeAtAngle(shade_round_shiny, pIndex*7.5) * 50
            val += (i % (10 + pIndex * twistK)) / (10 + pIndex * twistK) * 50
            stroke(0,val)
            await drawDot(newPs[pIndex])
        }
    }

    for (let i = 0; i < crv.length*5; i++) await tinyThread(choose(crv), clr)
}

async function tinyThread(p, clr, l = 1) {
    strokeWeight(0.1)
    noFill()
    const dir = p5.Vector.random2D().normalize()
    const lintLength = random(2, threadSize) * l
    stroke(clr)
    for (let j = 0; j < lintLength; j++) {
        dir.rotate(radians(random(-15, 15)))
        p.add(dir)
        await drawDot(p)
    }
}


class LayoutPattern {
    constructor(ps) {
        this.p = createGraphics(width, height)
        let newPs = []
        for (let i=0;i<ps.length-1;i++){
            const p1 = ps[i]
            const p2 = ps[i+1]
            const mid = p5.Vector.add(p1,p2).div(2)
            const l = p5.Vector.dist(p1,p2)/25
            mid.add(p5.Vector.sub(p2,p1).rotate(90).normalize().mult(random(-l,l)))
            const crv = makeCurve([p1,mid,p2])
            newPs = [...newPs,...crv]
        }
        this.ps = newPs

        this.p.beginShape()
        this.p.curveVertex(this.ps[0].x, this.ps[0].y)
        this.ps.forEach(p => this.p.curveVertex(p.x, p.y))
        this.p.curveVertex(this.ps[this.ps.length-1].x, this.ps[this.ps.length-1].y)
        this.p.endShape(CLOSE)
        this.getDimension()
    }
    draw(){
        noFill()
        stroke(0)
        strokeWeight(3)
        beginShape()
        curveVertex(this.ps[0].x, this.ps[0].y)
        this.ps.forEach(p => curveVertex(p.x, p.y))
        curveVertex(this.ps[this.ps.length-1].x, this.ps[this.ps.length-1].y)
        endShape(CLOSE)
    }
    getDimension() {
        this.leftMost = this.ps.reduce((a, b) => a.x < b.x ? a : b).x
        const rightMost = this.ps.reduce((a, b) => a.x > b.x ? a : b).x
        this.topMost = this.ps.reduce((a, b) => a.y < b.y ? a : b).y
        const bottomMost = this.ps.reduce((a, b) => a.y > b.y ? a : b).y
        return { pos: v(this.leftMost, this.topMost), size: v(rightMost - this.leftMost, bottomMost - this.topMost) }
    }
    pointInPattern(p) {
        return alpha(this.p.get(p.x + this.leftMost, p.y + this.topMost)) > 0
    }
    distToBorder(p) {
        const patternP = p.copy().add(this.leftMost, this.topMost)
        let closest = 1000000
        for (let i = 0; i < this.ps.length; i++) {
            const s = this.ps[i]
            const e = this.ps[(i + 1) % this.ps.length]
            closest = min(closest, distToSegment(patternP, s, e))
        }
        return closest
    }
    testPrint() {
        for (let i = 0; i < this.ps.length; i++) {
            const s = this.ps[i]
            const e = this.ps[(i + 1) % this.ps.length]
            print(i, s, e)
        }
    }
    offset(h){
        let newPs = []
        for (let i=0;i<this.ps.length-1;i++){
            const p1 = this.ps[i]
            const p2 = this.ps[i+1]
            const dir = p5.Vector.sub(p1,p2).rotate(90).normalize().mult(h)
            newPs.push(p5.Vector.add(p1,dir))
        }
        this.ps = newPs
    }
    async goAlong(func){
        for (let i=0;i<this.ps.length;i+=5){
            const p = this.ps[i]
            await func(p)
        }
    }
    stitches(){
        const stitchLength = 15
        const stitchSkip = 7
        const all =[]
        for (let i=0;i<this.ps.length-stitchSkip+stitchLength-1;i+=stitchSkip+stitchLength){
            all.push([this.ps[i],this.ps[i+stitchLength]])
        }
        return all
    }
}