#ifdef GL_ES
precision mediump float;
#endif

varying vec2 vTexCoord;
uniform sampler2D tex0;

float random (vec2 st) {
    return fract(sin(dot(st.xy,vec2(12.9898,78.233)))*43758.5453123);
}

void main() {
  vec2 uv = vTexCoord;
  uv.y = 1.0 - uv.y;
  
  vec4 col = texture2D(tex0, uv);
  
  float strength = 0.2;
  strength = (random(uv)-0.5)*strength;
  float d = 0.8-distance(uv,vec2(0.5,0.5));
  strength = strength * d;
    
  col.r = col.r + strength;
  col.g = col.g + strength;
  col.b = col.b + strength;
  gl_FragColor = col;
}