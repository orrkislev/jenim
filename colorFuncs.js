const checkers = (clr, x, y) => {
    const gridSize = 120*initialThreadSize
    const haldGridSize = 60*initialThreadSize
    if ((x % gridSize < haldGridSize && y % gridSize < haldGridSize) || (x % gridSize > haldGridSize && y % gridSize > haldGridSize)) {
        clr = lerpColor(clr, color(0), 0.3)
    }
    return clr
}
const bleach_gradient = (clr,x,y) => {
    clr = lerpColor(clr,color(255), 1-y/baseHeight)
    return clr
}
const bleach_noise = (clr,x,y) => {
    const noiseScale = 80*initialThreadSize
    const v = noise(x/noiseScale,y/noiseScale,R.random(0.3))
    if (v<0.5) clr = lerpColor(clr,color(255),v+0.5)
    return clr 
}
const bleach_large = (clr,x,y)=>{
    val = y/baseHeight
    const noiseScale = 150 * initialThreadSize
    if (noise(x/noiseScale,y/noiseScale)<val) clr = lerpColor(clr,color(255),val)
    return clr
}

const stringYSize = R.random(3)
const strips = (clr,x,y)=>{
    if ((x+floor(y/stringYSize))%(120*initialThreadSize)<(60*initialThreadSize)) clr = lerpColor(clr,color(255),0.4)
    return clr
}

let paintersLayers = []
const initPainters = ()=>{
    for (let i=0;i<2;i++)
        paintersLayers.push({
            s:R.random(50,200), val:R.random(.2,.5), z:R.random(10), color: makeColor(R.random(0,120),360,R.random(120,360))
        })
}
const painters1 = (clr,x,y)=>{
    for (let i=paintersLayers.length-1;i>=0;i--){
        const paintersLayer = paintersLayers[i]
        if (noise(x/paintersLayer.s,y/paintersLayer.s,paintersLayer.z)<paintersLayer.val) clr = lerpColor(clr,paintersLayer.color,1-y/baseHeight)
    }
    return clr
}
const painters2 = (clr,x,y)=>{
    for (let i=paintersLayers.length-1;i>=0;i--){
        const paintersLayer = paintersLayers[i]
        clr = lerpColor(clr,paintersLayer.color,noise(x/paintersLayer.s,y/paintersLayer.s,paintersLayer.z)*(1-y/baseHeight))
    }
    return clr
}



let globalColorFunc = null
function initColorFunc(){
    let r = R.random_dec()
    if (r<0.6) {
        globalColorFunc = null
        print('special coloring - none')
    } else {
        r = R.random_dec()
        if (r<0.08) {
            if (R.random_dec()<0.5) globalColorFunc = painters1
            else globalColorFunc = painters2
            initPainters()
            print('special coloring - painters')
        } else if (r<0.13) {
            globalColorFunc = checkers
            print('special coloring - checkers')
        } else globalColorFunc = R.random_choice([bleach_gradient,bleach_large,bleach_noise,strips])
        if (globalColorFunc == bleach_gradient) print('special coloring - gradient')
        if (globalColorFunc == bleach_large) print('special coloring - half bleach')
        if (globalColorFunc == bleach_noise) print('special coloring - blech spots')
        if (globalColorFunc == strips) print('special coloring - strips')
    }
}






function applyColorFunc(denim,colorFunc){
    if (colorFunc){
        const offsetPosX = R.random(-35,35)
        const offsetPosY = R.random(-35,35)
        denim.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    loop.color = colorFunc(loop.color,p.x+offsetPosX,p.y+offsetPosY)
                }
            })
        })
    }
}






const initBaseColor = ()=>{
    const r = R.random_dec()
    if (r<0.7){
        stitchColor = color('orange')
        denimColor =  makeColor(R.random(200,250),360,R.random(180,360))   // indigo
        patchStitchColor = R.random_choice([color(255,0,0),color(0),color(255)])
        print('base color - indigo')
    } else if (r<0.8){
        stitchColor = color(255)
        denimColor = makeColor(0,0,0)             // black
        patchStitchColor = color(255)
        print('base color - black')
    } else {
        stitchColor = color(255)
        denimColor =  makeColor(R.random(0,70))       // random color
        patchStitchColor = color(0)
        print('base color - colorful')
    }
}



function makeColor(h,s=360,b=360){
    colorMode(HSB,360)
    let c = color(h,s,b)
    colorMode(RGB)
    c = c.toRGB()
    return c
}
function neighborColor(c, h = 0, s = null, b = null) {
    colorMode(HSB, 360)
    const newH = hue(c) + h
    const newS = s != null ? map(saturation(c),0,100,0,360) + s : R.random(360)
    const newB = b != null ? brightness(c) + b : R.random(360)
    let c1 = color(newH,newS,newB)
    colorMode(RGB)
    c1 = c1.toRGB()
    return c1
}
const neighborColors = (colors) => colors.map(c => neighborColor(c))