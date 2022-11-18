const gold = ['#a67c00', '#bf9b30', '#ffbf00', '#ffcf40', '#ffdc73']
const natural = ['#ede8d3', '#fafaf7', '#fcfcfc']

function checkers() {
    const gridSize = 120 * initialThreadSize
    const haldGridSize = 60 * initialThreadSize
    return (clr, x, y) => {
        if ((x % gridSize < haldGridSize && y % gridSize < haldGridSize) || (x % gridSize > haldGridSize && y % gridSize > haldGridSize)) {
            clr = lerpColor(clr, color(0), 0.3)
        }
        return clr
    }
}
function bleach_gradient() {
    return (clr, x, y) => {
        clr = lerpColor(clr, color(255), 1 - y / baseHeight)
        return clr
    }
}
function bleach_noise() {
    const noiseScale = R.random(50, 150) * initialThreadSize
    const xoffset = R.random(10000)
    const yoffset = R.random(10000)
    const threshold = R.random(0.2, 0.8)
    const noiseNoise = round(R.random())
    return (clr, x, y) => {
        const v = noise(x / noiseScale + xoffset, y / noiseScale + yoffset, R.random(0.3) * noiseNoise)
        if (v < threshold) clr = lerpColor(clr, color(255), v + .5)
        else if (v < threshold + .1) clr = lerpColor(clr, color(255), map(v, threshold, threshold + .1, threshold + .5, 0))
        return clr
    }
}
function bleach_large() {
    const bleachScale = R.random(20, 100) * initialThreadSize
    const xoffset = R.random(10000)
    const yoffset = R.random(10000)
    return (clr, x, y) => {
        val = y / baseHeight
        if (noise(x / bleachScale + xoffset, y / bleachScale + yoffset) < val) clr = lerpColor(clr, color(255), val)
        return clr
    }
}

function strips() {
    const stripYSize = R.random(3)
    return (clr, x, y) => {
        if ((x + floor(y / stripYSize)) % (120 * initialThreadSize) < (60 * initialThreadSize)) clr = lerpColor(clr, color(255), 0.4)
        return clr
    }
}

let paintersLayers = []

const camoColors = ['#2E2C24', '#AC9F7C', '#503F38', '#56583D', '#E5E7EB', '#9D2328']
function painters_camo() {
    camoColors.sort(() => R.random_dec() - .5)
    for (let i = 0; i < 4; i++)
        paintersLayers.push({
            s: R.random(100, 400), val: R.random(.4, .6), z: R.random(10), color: color(camoColors[i])
        })
    return (clr, x, y) => {
        for (let i = paintersLayers.length - 1; i >= 0; i--) {
            const paintersLayer = paintersLayers[i]
            if (noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) < paintersLayer.val)
                clr = lerpColor(clr, paintersLayer.color, .8)
        }
        return clr
    }
}
function painters_grad() {
    const hue = R.random(360)
    for (let i = 0; i < 2; i++)
        paintersLayers.push({
            s: R.random(100, 400), val: R.random(.4, .6), z: R.random(10), color: makeColor((hue + R.random(-60, 60)) % 360, 360, R.random(200, 360))
        })
    return (clr, x, y) => {
        for (let i = paintersLayers.length - 1; i >= 0; i--) {
            const paintersLayer = paintersLayers[i]
            clr = lerpColor(clr, paintersLayer.color, noise(x / paintersLayer.s, y / paintersLayer.s, paintersLayer.z) * (1 - y / baseHeight))
        }
        return clr
    }
}
function painters_pollock() {
    polockImage = createGraphics(baseWidth, baseHeight)
    const sumSplashes = map(initialThreadSize, 0.5, 2, 500, 150)
    const splashScale = R.random()
    for (let i = 0; i < sumSplashes; i++) {
        polockImage.fill(R.random_choice([color(0), color(255)]))
        polockImage.noStroke()
        const pos = v(R.random(baseWidth), R.random(baseHeight))
        const dir = v(R.random(-.1, .1), R.random(-.1, .1))
        const l = R.random(200, 30) * initialThreadSize * splashScale
        let noiseVal = R.random(100)
        for (let j = 0; j < l; j++) {
            const size = noise(noiseVal, 10) ** 2 * map(j, 0, l, 45, 5) * initialThreadSize
            noiseVal += 0.02
            polockImage.circle(pos.x, pos.y, size)
            pos.add(dir)
            dir.rotate(R.random(-4, 4))
            dir.setMag(dir.mag() * 1.04)
        }
    }
    return (clr, x, y) => {
        const c = polockImage.get(x, y)
        if (c[3] > 0) return lerpColor(clr, color(c), 0.7)
        return clr
    }
}



function getColorFunc() {
    let r = R.random_dec()
    if (r < 0.5) return null

    let options = [bleach_gradient, bleach_large, bleach_noise, strips, checkers, painters_camo, painters_pollock, painters_grad]
    if (composition.name == "withDivide") options = [bleach_gradient, bleach_large, bleach_noise, strips, checkers]
    res = R.random_choice(options)
    return res
}






function applyColorFunc(denim, colorFunc) {
    if (colorFunc) {
        colorFunc = colorFunc()
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
        denimColor = makeColor(R.random(195, 240), 360, R.random(180, 360))
        patchStitchColor = R.random_choice([color(255, 0, 0), color(0), color(255)])
        print('indigo')
    } else if (r < 0.8) {
        stitchColor = color(255)
        denimColor = makeColor(0, 0, 0)
        patchStitchColor = color(255)
        print('black')
    } else {
        stitchColor = color(255)
        denimColor = makeColor(R.random(0, 70), R.random(200, 360), R.random(100, 250))
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
    const newS = s == null ? R.random(360) : map(saturation(c), 0, 100, 0, 360) + s
    const newB = b == null ? R.random(360) : brightness(c) + b
    let c1 = color(newH, newS, newB)
    colorMode(RGB)
    c1 = c1.toRGB()
    return c1
}