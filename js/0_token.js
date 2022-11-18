function genTokenData(projectNum) {
    let data = {};
    let hash = "0x";
    for (var i = 0; i < 64; i++) {
        hash += Math.floor(Math.random() * 16).toString(16);
    }
    data.hash = hash;
    data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
    return data;
}


let tokenData = genTokenData()

// tokenData = {
//     hash: '0xff7587496339d602ed536a2a9ab593c63f265554dea7cf4e7f9e8d5f5f708ae5',
//     tokenId: null
// }

// let tokenData = {"tokenId":"105000056","hash":"0x942f86dc03a96530ba428eed453ac0b7df92fdd450d5f05fb735b4407aec0ed5"}