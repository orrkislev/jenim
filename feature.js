features = calculateFeatures(tokenData)
console.log(features)

function calculateFeatures(tokenData) {

    class ABRandom {
        constructor() {
            this.usage = 0
            this.useA = false;
            let sfc32 = function (uint128Hex) {
                let a = parseInt(uint128Hex.substr(0, 8), 16);
                let b = parseInt(uint128Hex.substr(8, 8), 16);
                let c = parseInt(uint128Hex.substr(16, 8), 16);
                let d = parseInt(uint128Hex.substr(24, 8), 16);
                return function () {
                    a |= 0; b |= 0; c |= 0; d |= 0;
                    let t = (((a + b) | 0) + d) | 0;
                    d = (d + 1) | 0;
                    a = b ^ (b >>> 9);
                    b = (c + (c << 3)) | 0;
                    c = (c << 21) | (c >>> 11);
                    c = (c + t) | 0;
                    return (t >>> 0) / 4294967296;
                };
            };
            this.prngA = new sfc32(tokenData.hash.substr(2, 32));
            this.prngB = new sfc32(tokenData.hash.substr(34, 32));
            for (let i = 0; i < 1e6; i += 2) {
                this.prngA();
                this.prngB();
            }
        }
        random_dec() {
            this.usage++
            this.useA = !this.useA;
            return this.useA ? this.prngA() : this.prngB();
        }
        random_num(a, b) {
            return a + (b - a) * this.random_dec();
        }
        random_int(a, b) {
            return Math.floor(this.random_num(a, b + 1));
        }
        random_choice(list) {
            return list[this.random_int(0, list.length - 1)];
        }
        random = (a = 1, b = 0) => this.random_num(a, b)
        random_in = (minMax) => this.random_num(minMax[0], minMax[1])
    }

    // ---------------------- COLOR FUNCS ----------------------

    const getColorFunc = (R, specialWeave) => {
        let r = R.random_dec()
        if (r < 0.5) return 'Plain'

        let options = ["Bleaches", "Bleaches", "Bleaches_large", "Jailhouse Strips", "Checkers", 'Camou', 'Painters Pants', 'Tie Dye']
        if (specialWeave) options = ['Bleaches', 'Bleaches_large', 'Jailhouse Strips', 'Tie Dye']
        res = R.random_choice(options)
        if (res == 'Bleaches_large') {
            x = R.random(20, 100)
            res = "Bleaches"
        }
        if (res == 'Strips') x = R.random(3)
        if (['Painters Pants', 'Tie Dye', 'Camou'].includes(res)) {
            x = { s: R.random(300, 600), val: R.random(.4, .6), z: R.random(10), color: [R.random(0, 120), 360, R.random(120, 360)] }
            x = { s: R.random(300, 600), val: R.random(.4, .6), z: R.random(10), color: [R.random(0, 120), 360, R.random(120, 360)] }
            if (res == 'Painters Pants') {
                for (let i = 0; i < 150; i++) {
                    x = R.random_choice([color(0), color(255)])
                    x = [R.random(baseWidth), R.random(baseHeight)]
                    x = [R.random(-.1, .1), R.random(-.1, .1)]
                    x = R.random(50, 250)
                    x = R.random(100)
                    for (let j = 0; j < l; j++) {
                        x = R.random(-4, 4)
                    }
                }
            }
        }
        return res
    }

    const getColors = (R) => {
        const r = R.random_dec()
        if (r < 0.7) {
            x = [R.random(200, 250), 360, R.random(180, 360)]
            patchStitch = R.random_choice(['Red', 'Black', 'White'])
            return { color: 'Indigo', denimStitch: 'Mustard', patchStitch }
        } else if (r < 0.8) {
            return { color: 'Black', denimStitch: 'White', patchStitch: 'Black' }
        } else {
            x = [R.random(0, 70), R.random(200, 360), R.random(100, 250)]
            return { color: 'Colored', denimStitch: 'White', patchStitch: 'Black' }
        }
    }

    // ---------------------- WEAVE FUNCS ----------------------

    function initDenimParams(R) {
        let specialWeave = false
        if (R.random_dec() < 0.07) {
            specialWeave = true
            x = R.random_int(1, 3)
            x = Array(R.random_int(1, 3)).fill(0).map(a => R.random_int(1, 3))
            x = Array(R.random_int(1, 3)).fill(0).map(a => R.random_int(1, 3))
        }
        return specialWeave
    }

    R = new ABRandom(tokenData)

    x = R.random_int(20000)
    x = [R.random(5, 10), R.random(5, 10)]
    x = R.random(2.5, 3.5)

    specialWeave = initDenimParams(R)
    colors = getColors(R)
    dyePattern1 = getColorFunc(R, specialWeave)
    dyePattern2 = "None"
    seams = "None"

    let composition = R.random_choice(['Layered', 'Patchie', 'Distressed'])
    if (composition == 'Layered') {
        dyePattern2 = getColorFunc(R, specialWeave)
        seams = colors.denimStitch
        x = R.random() < 0.5
        const withFringe = R.random() < 0.5
        if (withFringe) composition = "Fringes"
    } else if (composition == 'Patchie') {
        seams = colors.patchStitch
    } else if (composition == 'Distressed') {
    }
    return {
        "Composition": composition,
        "Color": colors.color,
        "Dye Pattern": dyePattern1,
        "Second Dye Pattern": dyePattern2,
        "Weave": specialWeave ? "Special" : "Normal",
        "Seams": seams,
    }
}