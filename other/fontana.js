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

const warpPattern = [15, 25]
const warpColors = natural //['#ae2012', '#517dae']
const weftPattern = [20, 8]
const weftColors = happy
const otherColors = gold


const BG = '#ffcf40'

const initialThreadSize = 4
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

    translate(width/2,height/2)
    rotate(30)
    translate(-width/2,-height/2)
    // await drawCanvas()
    const denim = new Denim(-200, -200, width+400, height+400, denimOptions[0])
    await denim.drawWarp()
    await denim.drawWeft()

    resetMatrix()

    await doSlice(v(width * .2, height * .1), 60, height * .7)
    // await doSlice(v(width * .4, height * .1), 90, height * .7)
    // await doSlice(v(width * .6, height * .2), 90, height * .6)
    // await doSlice(v(width * .8, height * .2), 90, height * .3)

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

async function doSlice(p1, sliceDir, l) {
    p3 = p1.copy().add(p5.Vector.fromAngle(radians(sliceDir)).setMag(l * random(0.8, 1.2)))
    p2 = p5.Vector.add(p1, p3).div(2).add(p5.Vector.fromAngle(radians(sliceDir + 90)).mult(random(-20, 20)))
    crv = makeCurve([p1, p2, p3])
    cutWidth = 20

    let dir;
    crv = crv.map((p, i) => {
        if (i < crv.length - 1) dir = p5.Vector.sub(crv[i + 1], p).heading() + 90
        const s = sin(180 * i / crv.length) * cutWidth
        return { pos: p, dir: dir, s: s }
    })

    noStroke()
    for (let i = 0; i < crv.length; i += 10) {
        const p = crv[i].pos
        const s = crv[i].s
        fill(0)
        let gradient = drawingContext.createRadialGradient(p.x, p.y, s, p.x, p.y, s * 10);
        gradient.addColorStop(0, 'rgba(255,255,255,0.06)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        drawingContext.fillStyle = gradient
        arc(p.x, p.y, s * 20 + 50, s * 20 + 50, dir + 0, dir + 90)

        gradient = drawingContext.createRadialGradient(p.x, p.y, s, p.x, p.y, s * 2);
        gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        drawingContext.fillStyle = gradient
        arc(p.x, p.y, s * 4, s * 4, dir + 0, dir + 90)

        gradient = drawingContext.createRadialGradient(p.x, p.y, s, p.x, p.y, s * 10);
        gradient.addColorStop(0, 'rgba(0,0,0,0.06)');
        gradient.addColorStop(1, 'transparent');
        drawingContext.fillStyle = gradient
        arc(p.x, p.y, s * 20 + 50, s * 20 + 50, dir + 90, dir + 180)

        gradient = drawingContext.createRadialGradient(p.x, p.y, s, p.x, p.y, s * 2);
        gradient.addColorStop(0, 'rgba(0,0,0,0.3)');
        gradient.addColorStop(1, 'transparent');
        drawingContext.fillStyle = gradient
        arc(p.x, p.y, s * 4, s * 4, dir + 90, dir + 180)
    }

    fill(255)
    fill(0)
    crv.forEach(p => {
        circle(p.pos.x, p.pos.y, p.s)
    })

    // stroke(255)
    // strokeWeight(1)
    // for (let i = 0; i < crv.length; i += floor(random(2, 600))) {
    //     const p = crv[i].pos.copy()
    //     p.add(crv[i].s * random(1,2) * (round(random()) * 2 - 1))
    //     l = cutWidth * random(6, 10)
    //     threadSize = initialThreadSize*0.2
    //     const ps = [p]
    //     const dir = p5.Vector.random2D().setMag(threadSize*30)
    //     for (let j=0;j<10;j++){
    //         dir.rotate(radians(random(-20,20)))
    //         dir.setHeading(dir.heading()+(PI/2-dir.heading())/3)
    //         ps.push(ps[ps.length-1].copy().add(dir))
    //     }
    //     await thread(ps, color(255))
    // }
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


async function drawCanvas() {
    background(denimOptions[0][0])
    stroke(255, 50)
    strokeWeight(.2)
    for (let i = 0; i < 100000; i++) {
        const x = random(width)
        const y = random(height)
        const l = random(100)
        if (random() < 0.5) line(x, y, x + l, y)
        if (random() < 0.5) line(x, y, x + l, y + l)
        if (random() < 0.5) line(x, y, x, y + l)
    }
    c = color(denimOptions[0][0])
    c.setAlpha(60)
    stroke(c)
    for (let i = 0; i < 100000; i++) {
        const x = random(width)
        const y = random(height)
        const l = random(100)
        if (random() < 0.5) line(x, y, x + l, y)
        if (random() < 0.5) line(x, y, x + l, y + l)
        if (random() < 0.5) line(x, y, x, y + l)
    }
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