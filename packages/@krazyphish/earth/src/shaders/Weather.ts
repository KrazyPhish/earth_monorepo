export const dark = `
uniform sampler2D colorTexture;
in vec2 v_textureCoordinates;
uniform float scale;
uniform vec3 offset;

void main() {
  vec4 color = texture(colorTexture, v_textureCoordinates);
  out_FragColor = vec4(color.r*0.2,color.g * 0.4,color.b*0.6, 1.0);
}`
