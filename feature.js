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

    const getColorFunc = (R) => {
        let r = R.random_dec()
        if (r < 0.5) return 'Plain'

        let options = ["Bleaches", "Bleaches", "Bleaches", "Jailhouse Strips", "Checkers",'Painters Pants', 'Plain']
        if (!(['Distressed', 'Fringes'].includes(composition))) options.push('Camou')
        if (composition == "Layered") options = ["Bleaches", 'Bleaches', 'Bleaches', 'Jailhouse Strips', 'Checkers']
        res = R.random_choice(options)
        return res
    }

    const getBaseColor = (R) => {
        let r = R.random_dec()
        if (r < 0.7) {
            patchStitch = R.random_choice(['Red', 'Black', 'White'])
            return { color: 'Indigo', denimStitch: 'Ochre', patchStitch }
        } else if (r < 0.8) {
            return { color: 'Charcoal', denimStitch: 'White', patchStitch: 'Black' }
        } else {
            return { color: 'Colored', denimStitch: 'White', patchStitch: 'Black' }
        }
    }

    // ---------------------- WEAVE FUNCS ----------------------

    R = new ABRandom(tokenData)

    composition = R.random_choice(['Layered', 'Patchie', 'Distressed', 'Plain', 'Visible Mending', 'Ripped', 'Fringes'])
    colors = getBaseColor(R)
    dyePattern1 = getColorFunc(R)
    dyePattern2 = R.random() < 0.5 ? dyePattern1 : getColorFunc(R)

    feature_dyePattern2 = "None"
    seams = "None"

    if (composition == 'Layered') {
        feature_dyePattern2 = dyePattern2
        seams = colors.denimStitch
    } else if (composition == 'Patchie' || composition == 'Visible Mending') {
        seams = colors.patchStitch
    }

    return {
        "Composition": composition,
        "Tinting": colors.color,
        "Dye Pattern": dyePattern1,
        "Second Dye Pattern": feature_dyePattern2,
        "Seams": seams,
    }
}