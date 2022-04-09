// ~~~~~~~~~~~~~~~~~~~~~~~~ 
// ~~~~~~~~~~~~~~~~~~~~~~~~ DRAWING
// ~~~~~~~~~~~~~~~~~~~~~~~~ 
allDots = 0
function myRect(x, y, w, h) {
    myLine(x - w / 2, y - h / 2, x + w / 2, y - h / 2)
    myLine(x + w / 2, y - h / 2, x + w / 2, y + h / 2)
    myLine(x + w / 2, y + h / 2, x - w / 2, y + h / 2)
    myLine(x - w / 2, y + h / 2, x - w / 2, y - h / 2)
}

function myLine(x1, y1, x2, y2) {
    myLineV(createVector(x1, y1), createVector(x2, y2))
}

function myLineV(v1, v2) {
    const l = p5.Vector.dist(v1, v2)
    for (let i = 0; i < l; i++) {
        const v = p5.Vector.lerp(v1, v2, i / l)
        circle(v.x, v.y, random(3))
        allDots++
    }
}

function myEllipse(x, y, w, h) {
    const steps = round(PI + (w + h) / 2)
    const ew = w * 0.675

    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        const px = bezierPoint(x, x + ew, x + ew, x, t);
        const py = bezierPoint(y - h / 2, y - h / 2, y + h / 2, y + h / 2, t);
        circle(px, py, random(3));
        allDots++
    }
    for (let i = 0; i <= steps; i++) {
        let t = i / steps;
        const px = bezierPoint(x, x - ew, x - ew, x, t);
        const py = bezierPoint(y - h / 2, y - h / 2, y + h / 2, y + h / 2, t);
        circle(px, py, random(3));
        allDots++
    }
}

function myArc(x, y, w, h, s, e) {
    ps = getArcPoints(x, y, w, h, s, e)
    ps.forEach(p => circle(p.x, p.y, random(3)))
    allDots += ps.length
}

function getArcPoints(x, y, w, h, s, e) {
    const steps = round((PI + (w + h) / 2))
    const eh = h * 0.675

    let points = []

    for (let i = steps * min(s, 1); i <= steps * (min(e, 1)); i++) {
        let t = i / steps;
        const px = bezierPoint(x - w / 2, x - w / 2, x + w / 2, x + w / 2, t);
        const py = bezierPoint(y, y + eh, y + eh, y, t);
        points.push(createVector(px, py))
    }

    if (e > 1) {
        e = e - 1
        s = s > 1 ? s - 1 : 0
        for (let i = steps * min(s, 1); i <= steps * (min(e, 1)); i++) {
            let t = i / steps;
            const px = bezierPoint(x + w / 2, x + w / 2, x - w / 2, x - w / 2, t);
            const py = bezierPoint(y, y - eh, y - eh, y, t);
            points.push(createVector(px, py))
        }
    }
    return points
}