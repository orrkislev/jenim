const shade_round = [[0.0, 0.5], [0.2, 0.0], [0.5, 0.0], [0.75, 0.5], [1.0, 1.0]]
const shade_round_shiny = [[0.0, 0.5], [0.1, 0.0], [0.1, 0.3], [0.3, 0], [0.4, 0], [0.6, 1], [0.8, 0.3], [0.9, 0], [1.0, 1.0]]
const shade_hex = [
    [0.00, 0.2], [0.25, 0.5],
    [0.25, 0.0], [0.50, 0.0],
    [0.50, 0.8], [0.75, 0.2],
    [0.75, 1.0], [1.00, 0.5]]
const shade_point = [
    [0.0, 0.4], [0.2, 0.1], [0.5, 0.0],
    [0.5, 0.6], [0.8, 0.2], [1.0, 0.6],
]
const shade_flat = [
    [0.0, 1.0],
    [0.25, 1.0],
    [0.5, 1.0],
    [0.8, 1.0],
    [0.9, 1.0],
    [1.0, 1.0]
]

const allShades = [shade_point]

function getShadeAtAngle(shadeStyle, angle, shadeSteps = false) {
    if (angle < 0) angle += 360
    if (angle > 180) angle = 360 - angle
    const t = map(angle, 180, 0, 0, 1)
    let v = getShadeAtVal(shadeStyle, t)
    if (shadeSteps) v = round(v*shadeSteps)/shadeSteps
    return v
}
function getShadeAtVal(shadeStyle, t) {
    for (let i = 0; i < shadeStyle.length - 1; i++) {
        const posS = shadeStyle[i][0]
        const posE = shadeStyle[i + 1][0]
        const valS = shadeStyle[i][1]
        const valE = shadeStyle[i + 1][1]

        if (t >= posS && t <= posE) {
            return lerp(valS, valE, (t - posS) / (posE - posS))
        }
    }
    return -1
}