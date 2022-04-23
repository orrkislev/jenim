let allDots = 0
async function drawDot(p) {
    allDots++
    if (allDots % 20000 == 0) await timeout(0);
    point(p.x, p.y)
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}



async function dodge(p, size, force = 7) {
    blendMode(DODGE)
    stroke(200, 200, 255, force)
    // noStroke()
    // circle(p.x, p.y, size * random(0.4, 1))
    await softBrush(p, size)
    blendMode(BLEND)
}

async function burn(p, size, force = 7) {
    blendMode(BURN)
    fill(30, 30, 90, force)
    noStroke()
    circle(p.x, p.y, size * random(0.4, 1))
    // await softBrush(p, size)
    blendMode(BLEND)
}
async function softBrush(p, r) {
    for (let i = 0; i < r * 10; i++) {
        const rr = random() * r / 2
        const a = random(360)
        strokeWeight(random(2))
        await drawDot(p.copy().add(cos(a) * rr, sin(a) * rr))
    }
}