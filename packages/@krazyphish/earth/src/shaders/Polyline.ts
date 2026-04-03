export const flowingDash = `
uniform vec4 color;
uniform vec4 gapColor;
uniform float length;
uniform float pattern;
in float v_polylineAngle;

const float maskLength = 16.0;

mat2 rotate(float rad) {
  float c = cos(rad);
  float s = sin(rad);
  return mat2(
    c, s,
    -s, c
  );
}

czm_material czm_getMaterial(czm_materialInput materialInput)
{
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;

  // Get the relative position within the dash from 0 to 1
  float dashPosition = fract(pos.x / (length * czm_pixelRatio) - czm_frameNumber / 60.0 * direction * speed);
  // Figure out the mask index.
  float maskIndex = floor(dashPosition * maskLength);
  // Test the bit mask.
  float maskTest = floor(pattern / pow(2.0, maskIndex));
  vec4 fragColor = (mod(maskTest, 2.0) < 1.0) ? gapColor : color;
  if (fragColor.a < 0.005) {   // matches 0/255 and 1/255
    discard;
  }

  fragColor = czm_gammaCorrect(fragColor);
  material.emission = fragColor.rgb;
  material.alpha = fragColor.a;
  return material;
}`

export const flowingWave = `
in float v_polylineAngle;

mat2 rotate(float rad) {
  float c = cos(rad);
  float s = sin(rad);
  return mat2(
    c, s,
    -s, c
  );
}

czm_material czm_getMaterial(czm_materialInput materialInput)
{
  czm_material material = czm_getDefaultMaterial(materialInput);

  vec4 fragColor = color;
  vec2 pos = rotate(v_polylineAngle) * gl_FragCoord.xy;          
  fragColor.a = sin(fract(pos.x / (length * czm_pixelRatio) - czm_frameNumber / 60.0 * direction * speed) * ${Math.PI});

  material.diffuse = fragColor.rgb;
  material.alpha = fragColor.a;
  return material;
}`

export const trailing = `
czm_material czm_getMaterial(czm_materialInput materialInput) {
  czm_material material = czm_getDefaultMaterial(materialInput);
  vec2 st = materialInput.st;
  vec4 colorImage = texture(image, vec2(fract((st.s * direction - speed * czm_frameNumber * 0.001)), st.t));
  material.alpha = colorImage.a * color.a;
  material.diffuse = color.rgb;
  return material;
}`
