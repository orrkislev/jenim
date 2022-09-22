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

    function initPainters(colorFunc) {
        for (let i = 0; i < 2; i++)
            paintersLayers.push({
                s: R.random(300, 600), val: R.random(.4, .6), z: R.random(10), x: [R.random(0, 120), 360, R.random(120, 360)]
            })

        if (colorFunc == 'painters_pollock') {
            for (let i = 0; i < 150; i++) {
                const x = R.random_choice([0,1])
                const pos = [R.random(baseWidth), R.random(baseHeight)]
                const dir = [R.random(-.1, .1), R.random(-.1, .1)]
                const l = R.random(50, 250)
                let noiseVal = R.random(100)
                for (let j = 0; j < l; j++) {
                    const d = R.random(-4, 4)
                }
            }
        }

    }

    function initColorFunc(R, specialWeave) {
        let res = null
        let r = R.random_dec()
        if (r < 0.6) res = null
        else {
            let options = ['bleach_gradient', 'bleach_large', 'bleach_noise', 'strips', 'checkers', 'painters_camo', 'painters_pollock']
            if (specialWeave) options = ['bleach_gradient', 'bleach_large', 'strips']
            res = R.random_choice(options)
            if (res == 'painters_pollock' || res == 'painters_camo') initPainters(R, res)
        }
        return res
    }

    const initBaseColor = (R) => {
        let res = ''
        const r = R.random_dec()
        if (r < 0.7) {
            denimColor = [R.random(200, 250), 360, R.random(180, 360)]
            patchStitchColor = R.random_choice([1, 2, 3])
            res = 'indigo'
        } else if (r < 0.8) {
            res = 'black'
        } else {
            denimColor = [R.random(0, 70), R.random(200, 360), R.random(100, 250)]
            res = 'colorful'
        }
        return res
    }

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
    clr = initBaseColor(R)
    colored = initColorFunc(R, specialWeave)

    let composition = R.random_choice(['divide', 'patches', 'rips'])
    return {
        composition, clr
    }
}