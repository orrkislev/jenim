function offsetPoints(points, x, y) {
    points.forEach(p => {
        p.pos.x += x
        p.pos.y += y
    })
}

function getPerspectiveCirclePoints(r, s, e) {
    const points = []
    for (let i = 0; i < abs(s - e); i += 3) {
        const p = i / abs(s - e)
        const a = lerp(s, e, p)
        const pos = getPointOnEllipse(r, r * 0.4, a)
        points.push({ pos: pos, angle: a })
    }
    return points
}

function getPointOnEllipse(w, h, a) {
    return createVector(w * 0.5 * cos(a), h * 0.5 * sin(a))
}
function getEllipse(w, h, step = 1, s = 0, e = 360) {
    const ps = []
    for (let a = s; a < e; a += step) ps.push(getPointOnEllipse(w, h, a))
    return ps
}

function makeCurve(crv) {
    crv.push(crv[crv.length - 1])
    crv.splice(0, 0, crv[0])

    const newCrv = []
    for (let i = 0; i < crv.length - 3; i++) {
        const nextP = crv[i + 1]
        const nextnextP = crv[i + 2]
        const l = p5.Vector.dist(nextP, nextnextP)
        for (let t = 0; t < l; t++) {
            x = curvePoint(crv[i].x, crv[i + 1].x, crv[i + 2].x, crv[i + 3].x, t / l)
            y = curvePoint(crv[i].y, crv[i + 1].y, crv[i + 2].y, crv[i + 3].y, t / l)
            newCrv.push(createVector(x, y))
        }
    }
    return newCrv
}


function distToSegment(p, s, e) {
    const segLength = p5.Vector.dist(s, e);
    if (segLength == 0) return p5.Vector.dist(p, s);

    let t = ((p.x - s.x) * (e.x - s.x) + (p.y - s.y) * (e.y - s.y)) / (segLength * segLength);
    t = max(0, min(1, t));
    return p5.Vector.dist(p, v(
        s.x + t * (e.x - s.x),
        s.y + t * (e.y - s.y)
    ));
}
