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

//   tokenData = {
//       hash: "0x057fdcf3d11bb1e95bf8300abcd6197e0e191b11cf64986ccf17e4735ea22abe",
//       tokenId: null
//   }

// let tokenData = {"tokenId":"105000003","hash":"0x066814c791b437ae3da6be12835720eadde41538098b735cd7c29cfaa145c7cc"}