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

tokenData = {
    hash: '0x37df95477534900ebf07a31571f5c99df211f213053967e7dfe1982de3bff8c6',
    tokenId: null
}

// let tokenData = {"tokenId":"105000056","hash":"0x942f86dc03a96530ba428eed453ac0b7df92fdd450d5f05fb735b4407aec0ed5"}