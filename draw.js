allDots = 0
async function drawDot(p) {
    allDots++
    if (allDots % 20000 == 0) await timeout(0);
    point(p.x, p.y)
}
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}