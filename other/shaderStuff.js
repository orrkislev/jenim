let noiseShader
function preloadShader(){
  noiseShader = loadShader('shader.vert', 'noise.frag');
}

function applyNoise(){
  let pic = get()
  graphics = createGraphics(width, height, WEBGL );
  graphics.shader(noiseShader);
  noiseShader.setUniform('tex0', pic);
  graphics.rect(0,0,width,height)
  resetMatrix()
  image(graphics,0,0)
}
