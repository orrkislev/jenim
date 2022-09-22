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
//       hash: "0xcd5fb7172d587367cff11f8e1642d835708fedb2335d230350de2daee9925bc5",
//       tokenId: null
//   }

// let tokenData = {"tokenId":"105000003","hash":"0x066814c791b437ae3da6be12835720eadde41538098b735cd7c29cfaa145c7cc"}