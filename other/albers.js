/// <reference path="./p5.global-mode.d.ts" />

const random = (a = 1, b = 0) => fxrand() * (b - a) + a
const choose = (arr) => arr[Math.floor(random(arr.length))]

const pallete1 = ['#a7dfff', '#467194', '#b07967', '#78544c']
const pallete2 = ['#fd0155', '#fa76c6']
const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const happy = ['#fca311', '#9d0208', '#ae2012', '#ffadad',]
const grayscale1 = ['#999', '#555']
const grayscale2 = ['#333', '#222', '#111']
const bgColor = ['#969387', '#f0eee6', '#54635e']
const natural = ['#f1edec', '#ffffff', '#fefae0', '#e6f5fa', '#fcfcfc']

const denimOptions = [
    ['#517dae', '#648de5'], ['#2b2d42', '#03071e'],
    ['#936639', '#6a040f'], ['#fe6d73', '#e63946']
]

alonaWarp = ['#b8c6cf']
alonaWeft = ['#027bc7', '#00609c']
alonaOther = ['#a87c31']

const warpPattern = [15, 25,6]
const warpColors = pallete2 //['#ae2012', '#517dae']
const weftPattern = [20, 8,5,12]
const weftColors = pallete1
const otherColors = ['#fe4716']


const BG = '#ffcf40'

const initialThreadSize = 12
let threadSize = initialThreadSize

function setup() {
    createCanvas(min(windowWidth, windowHeight), min(windowWidth, windowHeight));
    angleMode(DEGREES)
    noLoop()
    noFill()
    makeImage()
}

async function makeImage() {
    clear()

    startX = 50
    startY = 100
    startW = width - 100
    startH = height - 400
    fringeLength = 300

    makeWarp()
    makeWeft()
    makeOthers()

    await drawWarp()
    await drawOthers()
    await drawWeft()
    await drawOtherArcs()
    await drawFringe()

    noStroke()
    resetMatrix()
    addBG()

    p = get()
    blendMode(SOFT_LIGHT)
    image(p,0,0)
    blendMode(BLEND)

    applyNoise()
    
    finishImage()
}

async function drawWarp() {
    noStroke()
    for (let i = 0; i < warp.length; i++) {
        const w = warp[i]
        threadSize = w.height
        await thread(w.points, w.color)
    }
}

async function drawWeft() {
    for (let i = 0; i < weft.length; i++) {
        for (let j = 0; j < weft[i].length; j++) {
            const w = weft[i][j]
            threadSize = w.width
            const ps = [w.pos.copy().add(0, -w.height / 2), w.pos.copy().add(0, w.height / 2)]
            await thread(ps, w.color)
        }
    }
}

async function drawOthers() {
    for (let i = 0; i < others.length; i++) {
        threadSize = others[i].size
        await thread(others[i].ps, others[i].color)
    }
}

async function drawOtherArcs() {
    for (let i = 0; i < otherArcs.length; i++) {
        threadSize = otherArcs[i].size
        await thread(otherArcs[i].ps, otherArcs[i].color)
    }
}

async function drawFringe() {
    threadSize = initialThreadSize * 0.5
    for (let i = 0; i < weft.length; i++) {
        for (let t = 0; t < 2; t++) {
            const ps = [weft[i][weft[i].length - 1].pos.copy()]
            for (let l = 0; l < fringeLength; l += random(15, 20)) {
                ps.push(ps[ps.length - 1].copy().add(random(-5, 5), random(15, 20)))
            }
            await thread(ps, weft[i][0].color)
        }

        for (let t = 0; t < 2; t++) {
            const ps = [weft[i][0].pos.copy()]
            for (let l = 0; l < fringeLength; l += random(15, 20)) {
                ps.push(ps[ps.length - 1].copy().add(random(-5, 5), -random(15, 20)))
            }
            await thread(ps, weft[i][0].color)
        }
    }
}

async function makeWarp() {
    threadSize = initialThreadSize * random(1, 2)
    warp = []
    warp.push({
        points: [v(startX, startY), v(startX + startW * .3, startY+threadSize*random(-3,3)), v(startX + startW * .6, startY+threadSize*random(-3,3)), v(startX + startW, startY+threadSize*random(-3,3))],
        height: threadSize,
        color: warpColors[0]
    })
    let count = 1
    while (warp[warp.length - 1].points.filter(p => p.y < startH).length > 0) {
        const ps = warp[warp.length - 1].points.map(p => p.copy().add(random(-1, 1), threadSize * random(0.8, 1.5)))
        threadSize = initialThreadSize * random(1, 2)
        if ((count++) % warpPattern[0] == 0) {
            count = 1
            warpPattern.push(warpPattern.shift())
            warpColors.push(warpColors.shift())
        }
        warp.push({ points: ps, height: threadSize, color: warpColors[0] })
    }
    warp.forEach(w => w.points = makeCurve(w.points))
}

async function makeWeft() {
    const startOffset = [0, 1]
    weft = []
    let count = 1
    for (let x = 0; x < startW; x += threadSize * random(0.9, 1.2)) {
        startOffset.push(startOffset.shift())
        if ((count++) % weftPattern[0] == 0) {
            count = 1
            weftColors.push(weftColors.shift())
            weftPattern.push(weftPattern.shift())
        }
        const column = []
        for (let y = startOffset[0]; y < warp.length; y += 2) {
            const i = round(x * (startW / warp[y].points.length))
            const pos = warp[y].points[i].copy()
            if (pos) column.push({ pos: pos, width: threadSize, height: warp[y].height, color: weftColors[0] })
        }
        weft.push(column)
        threadSize = initialThreadSize * random(0.75, 1.3)
    }
}

function makeOthers() {
    others = []
    otherArcs = []
    for (let otherIndex = 0; otherIndex < 3; otherIndex++) {
        otherColor = R.random_choice(otherColors)
        otherSize = initialThreadSize * 4
        let x = floor(random(2,weft.length/2))
        let y = floor(random(2,warp.length/2))
        let l = floor(weft.length/4)
        let d = 1
        lastOther = makeOther(x,y,l,d)
        for (let level=0;level<5;level++){
            if (l>2 && y<weft[0].length-5){
                newOther = makeOther(x+=l*d*2,y+=2,l-=5,d*=-1)
                connectOthers(lastOther,newOther)
                lastOther = newOther
            }
            else break
        }
    }
}
function makeOther(x, y, l, dir) {
    let points = Array(l).fill(0).map((p, i) => [x + dir * i * 2, y])
    points.forEach(p => {
        weft[p[0]][p[1]].height += otherSize
        weft[p[0]][p[1]].width *= random(0.5, .8)
        weft[p[0]-1][p[1]-1].pos.y -= otherSize/2
        weft[p[0]-1][p[1]+1].pos.y += otherSize/2
    })
    points = points.map(p => weft[p[0]][p[1]].pos.copy())
    points.forEach(p => p.add(0, threadSize * random(0, 0.5)))
    let other = { ps: points, size: otherSize, color: otherColor, dir:dir}
    others.push(other)
    return other
}
function connectOthers(other1,other2){
    mid = p5.Vector.lerp(other1.ps[other1.ps.length - 1], other2.ps[0],0.5).add(other1.dir*threadSize,0)
    otherArcs.push({ 
        ps: [other1.ps[other1.ps.length - 2], other1.ps[other1.ps.length - 1], mid, other2.ps[0], other2.ps[1]], 
        size: otherSize*0.6, 
        color: otherColor })
}

async function thread(ps, clr) {
    const crv = makeCurve(ps)
    stroke(clr)
    for (let i = 0; i < crv.length - 1; i++) {
        const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
        resetMatrix()
        translate(crv[i].x, crv[i].y)
        rotate(dir)
        line(-threadSize * 0.45, 0, threadSize * .45, 0)
    }
    resetMatrix()

    const arcPs = getEllipse(threadSize, threadSize * 0, 30, 180, 360)
    const twistK = random(-0.2, 0.2)
    for (let i = 0; i < crv.length - 1; i++) {
        const dir = p5.Vector.sub(crv[i + 1], crv[i]).heading() + 90
        const newPs = arcPs.map(p => p.copy())
        newPs.forEach(p => p.rotate(dir))
        newPs.forEach(p => p.add(crv[i]))
        for (let pIndex = 0; pIndex < newPs.length; pIndex++) {
            let val = getShadeAtVal(shade_round_shiny, i / crv.length)
            val += getShadeAtAngle(shade_round_shiny, 1 - (360 / pIndex))
            const twistVal = (i % (10 + pIndex * twistK)) / (10 + pIndex * twistK)
            stroke(255 - val * 127 + twistVal * 50, 120)
            await drawDot(newPs[pIndex])
        }
    }

    for (let i = 0; i < crv.length; i++) await tinyThread(R.random_choice(crv), clr)
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
    strokeWeight(1)
}

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function drawDot(p) {
    allDots++
    if (allDots % 10000 == 0) await timeout(0);
    point(p.x, p.y)
}











function addBG() {
    const fg_image = get()
    background(220)
    var gradient = drawingContext.createRadialGradient(width / 2, height / 2, 1, width / 2, height / 2, width);
    gradient.addColorStop(0, 'rgba(220,220,220,0)');
    gradient.addColorStop(1, '#777');
    drawingContext.fillStyle = gradient
    rect(0, 0, width, height)
    image(fg_image, 0, 0)
}