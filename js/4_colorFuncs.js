const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

const checkers = (clr, x, y) => {
    const gridSize = 120 * initialThreadSize
    const haldGridSize = 60 * initialThreadSize
    if ((x % gridSize < haldGridSize && y % gridSize < haldGridSize) || (x % gridSize > haldGridSize && y % gridSize > haldGridSize)) {
        clr = lerpColor(clr, color(0), 0.3)
    }
    return clr
}
const bleach_gradient = (clr, x, y) => {
    clr = lerpColor(clr, color(255), 1 - y / baseHeight)
    return clr
}
const bleach_noise = (clr, x, y) => {
    const noiseScale = 80 * initialThreadSize
    const v = noise(x / noiseScale, y / noiseScale, R.random(0.3))
    if (v < 0.5) clr = lerpColor(clr, color(255), v + 0.5)
    return clr
}
let bleachScale = null
const bleach_large = (clr, x, y) => {
    if (!bleachScale) bleachScale = R.random(20,100) * initialThreadSize
    val = y / baseHeight
    if (noise(x / bleachScale, y / bleachScale) < val) clr = lerpColor(clr, color(255), val)
    return clr
}

let stripYSize
const strips = (clr, x, y) => {
    if (!stripYSize) stripYSize = R.random(3)
    if ((x + floor(y / stripYSize)) % (120 * initialThreadSize) < (60 * initialThreadSize)) clr = lerpColor(clr, color(255), 0.4)
    return clr
}

let paintersLayers = []
let polockImage
const initPainters = () => {
    for (let i = 0; i < 2; i++)
        paintersLayers.push({
            s: R.random(300, 600), val: R.random(.4, .6), z: R.random(10), color: makeColor(R.random(0, 120), 360, R.random(120, 360))
        })
    
    if (globalColorFunc == painters_pollock) {
        polockImage = createGraphics(baseWidth, baseHeight)
        for (let i=0;i<150;i++){
            polockImage.fill(R.random_choice([color(0), color(255)]))
            polockImage.noStroke()
            const pos = v(R.random(baseWidth), R.random(baseHeight))
            const dir = v(R.random(-.1, .1), R.random(-.1, .1))
            const l = R.random(50, 250)
            let noiseVal = R.random(100)
            for (let j=0;j<l;j++){
                const size = noise(noiseVal, 10) ** 2 * map(j, 0, l, 90, 10)
                noiseVal += 0.02
                polockImage.circle(pos.x, pos.y,size)
                pos.add(dir)
                dir.rotate(R.random(-4,4))
                dir.setMag(dir.mag()*1.04)
            }
        }
    }
    
}
const painters_camo = (clr, x, y) => {
    for (let i = paintersLayers.length - 1; i >= 0; i--) {
        const paintersLayer = paintersLayers[i]
        if (noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) < paintersLayer.val) 
            clr = lerpColor(clr, paintersLayer.color, .7)
    }
    return clr
}
const painters_grad = (clr, x, y) => {
    for (let i = paintersLayers.length - 1; i >= 0; i--) {
        const paintersLayer = paintersLayers[i]
        clr = lerpColor(clr, paintersLayer.color, noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) * (1 - y / baseHeight))
    }
    return clr
}
const painters_pollock = (clr, x, y) => {
    if (polockImage){
        const c = polockImage.get(x, y)
        if (c[3]>0) return lerpColor(clr, color(c), 0.7)
    }
    return clr
}



let globalColorFunc = null
function initColorFunc() {
    let r = R.random_dec()
    if (r < 0.6) globalColorFunc = null
    else {
        let options = [bleach_gradient, bleach_large, bleach_noise, strips, checkers, painters_camo, painters_pollock]
        if (specialWeave) options = [bleach_gradient, bleach_large, strips]
        globalColorFunc = R.random_choice(options)
        if (globalColorFunc == painters_pollock || globalColorFunc == painters_camo) initPainters()
    }
}






function applyColorFunc(denim, colorFunc) {
    if (colorFunc) {
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
        denimColor = makeColor(R.random(200, 250), 360, R.random(180, 360))
        patchStitchColor = R.random_choice([color(255, 0, 0), color(0), color(255)])
        print('indigo')
    } else if (r < 0.8) {
        stitchColor = color(255)
        denimColor = makeColor(0, 0, 0)
        patchStitchColor = color(255)
        print('black')
    } else {
        stitchColor = color(255)
        denimColor = makeColor(R.random(0, 70), R.random(200,360), R.random(100,250))
        patchStitchColor = color(0)
        print('colorful')
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
    const newS = s != null ? map(saturation(c), 0, 100, 0, 360) + s : R.random(360)
    const newB = b != null ? brightness(c) + b : R.random(360)
    let c1 = color(newH, newS, newB)
    colorMode(RGB)
    c1 = c1.toRGB()
    return c1
}