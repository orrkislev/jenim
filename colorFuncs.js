const checkers = (clr, x, y) => {
    if ((x % 160 < 80 && y % 160 < 80) || (x % 160 > 80 && y % 160 > 80)) {
        clr = lerpColor(clr, color(0), 0.3)
    }
    return clr
}

const bleach_gradient = (clr,x,y) => {
    clr = lerpColor(clr,color(255), 1-y/height)
    return clr
}

const bleach_noise = (clr,x,y) => {
    const v = noise(x/100,y/100,random(0.5))
    if (v<0.5) clr = lerpColor(clr,color(255),v+0.5)
    return clr 
}

const bleach_large = (clr,x,y)=>{
    val = y/height
    if (noise(x/200,y/200)<val) clr = lerpColor(clr,color(255),val)
    return clr
}

let paintersLayers = null
const painters = (clr,x,y)=>{
    if (!paintersLayers){
        paintersLayers = []
        for (let i=0;i<10;i++)
            paintersLayers.push({
                s:random(50,200), val:random(.2,.5), z:random(10), color: makeColor(random(360),360,random(360,360))
            })
    }

    for (paintersLayer of paintersLayers){
        if (noise(x/paintersLayer.s,y/paintersLayer.s,paintersLayer.z)<paintersLayer.val) clr = lerpColor(clr,paintersLayer.color,0.25)
    }
    return clr
}

const colorFuncs = [checkers, bleach_gradient, bleach_large, bleach_noise, painters]






function applyColorFunc(denim,colorFunc){
    if (colorFunc)
        denim.weft.forEach(col => {
            col.forEach(loop => {
                if (loop.ps.length > 0) {
                    const p = loop.ps[0]
                    loop.color = colorFunc(loop.color,p.x,p.y)
                }
            })
        })
}






const getBaseColor = ()=>{
    const r = random()
    if (r<0.7){
        return makeColor(random(200,240))   // indigo
    } else if (r<0.8){
        return makeColor(0,0,0)             // black
    } else {
        return makeColor(random(360))       // random color
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
    const newS = s != null ? map(saturation(c),0,100,0,360) + s : random(360)
    const newB = b != null ? brightness(c) + b : random(360)
    let c1 = color(newH,newS,newB)
    colorMode(RGB)
    c1 = c1.toRGB()
    return c1
}
const neighborColors = (colors) => colors.map(c => neighborColor(c))