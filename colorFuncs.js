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
    const v = noise(x/100,y/100,random(0.3))
    if (v<0.5) clr = lerpColor(clr,color(255),v+0.5)
    return clr 
}
const bleach_large = (clr,x,y)=>{
    val = y/height
    if (noise(x/200,y/200)<val) clr = lerpColor(clr,color(255),val)
    return clr
}
const strips = (clr,x,y)=>{
    if ((x+floor(y/3))%160<80) clr = lerpColor(clr,color(255),0.4)
    return clr
}

let paintersLayers = null
const initPainters = ()=>{
    paintersLayers = []
    for (let i=0;i<2;i++)
        paintersLayers.push({
            s:random(50,200), val:random(.2,.5), z:random(10), color: makeColor(random(0,120),360,random(120,360))
        })
}
const painters1 = (clr,x,y)=>{
    for (paintersLayer of paintersLayers){
        if (noise(x/paintersLayer.s,y/paintersLayer.s,paintersLayer.z)<paintersLayer.val) clr = lerpColor(clr,paintersLayer.color,1-y/height)
    }
    return clr
}
const painters2 = (clr,x,y)=>{
    for (paintersLayer of paintersLayers){
        clr = lerpColor(clr,paintersLayer.color,noise(x/paintersLayer.s,y/paintersLayer.s,paintersLayer.z)*(1-y/height))
    }
    return clr
}



let globalColorFunc = null
function initColorFunc(){
    let r = random()
    if (r<0.6) globalColorFunc = null
    else{
        r = random()
        if (r<0.08) {
            if (random()<0.5) globalColorFunc = painters1
            else globalColorFunc = painters2
            initPainters()
        } else if (r<0.13) globalColorFunc = checkers
        else globalColorFunc = choose([bleach_gradient,bleach_large,bleach_noise,strips])
    }
}






function applyColorFunc(denim,colorFunc){
    if (colorFunc){
        const offsetPosX = random(-35,35)
        const offsetPosY = random(-35,35)
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
    const r = random()
    if (r<0.7){
        stitchColor = color('orange')
        denimColor =  makeColor(random(200,250),360,random(180,360))   // indigo
        patchStitchColor = choose([color(255,0,0),color(0),color(255)])
    } else if (r<0.8){
        stitchColor = color(255)
        denimColor = makeColor(0,0,0)             // black
        patchStitchColor = color(255)
    } else {
        stitchColor = color(255)
        denimColor =  makeColor(random(0,70))       // random color
        patchStitchColor = color(0)
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