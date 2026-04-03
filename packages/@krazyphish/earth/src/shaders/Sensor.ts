export const phasedSensor = `
uniform vec4 u_intersectionColor;
uniform float u_intersectionWidth;
uniform vec4 u_lineColor;
uniform vec4 u_colors[5];
uniform float u_steps[3];

bool inSensorShadow(vec3 coneVertexWC, vec3 pointWC) {
  // Diagonal matrix from the unscaled ellipsoid space to the scaled space.    
  vec3 D = czm_ellipsoidInverseRadii;

  // Sensor vertex in the scaled ellipsoid space
  vec3 q = D * coneVertexWC;
  float qMagnitudeSquared = dot(q, q);
  float test = qMagnitudeSquared - 1.0;

  // Sensor vertex to fragment vector in the ellipsoid's scaled space
  vec3 temp = D * pointWC - q;
  float d = dot(temp, q);

  // Behind silhouette plane and inside silhouette cone
  return (d < -test) && (d / length(temp) < -sqrt(test));
}

vec4 getLineColor() {
  return u_lineColor;
}

vec4 getIntersectionColor() {
  return u_intersectionColor;
}

float getIntersectionWidth() {
  return u_intersectionWidth;
}

vec2 sensor2dTextureCoordinates(float sensorRadius, vec3 pointMC) {
  // (s, t) both in the range [0, 1]
  float t = pointMC.z / sensorRadius;
  float s = 1.0 + (atan(pointMC.y, pointMC.x) / czm_twoPi);
  s = s - floor(s);

  return vec2(s, t);
}

vec4 getGradientColor(float radii) {
  vec4 c0 = u_colors[0];
  vec4 c1 = u_colors[1];
  vec4 c2 = u_colors[2];
  vec4 c3 = u_colors[3];
  vec4 c4 = u_colors[4];

  float s0 = 0.0;
  float s1 = u_steps[0];
  float s2 = u_steps[1];
  float s3 = u_steps[2];
  float s4 = 1.0;

  float p0 = 1.0 - step(s1, radii);
  float p1 = 1.0 - step(s2, radii) - p0;
  float p2 = 1.0 - step(s3, radii) - p1 - p0;
  float p3 = 1.0 - p2 - p1 - p0;

  vec4 m0 = mix(c0, c1, smoothstep(s0, s1, radii));
  vec4 m1 = mix(c1, c2, smoothstep(s1, s2, radii));
  vec4 m2 = mix(c2, c3, smoothstep(s2, s3, radii));
  vec4 m3 = mix(c3, c4, smoothstep(s3, s4, radii));

  return p0 * m0 + p1 * m1 + p2 * m2 + p3 * m3;
}`

export const phasedSensorFS = `
uniform bool u_showIntersection;
uniform bool u_showThroughEllipsoid;
uniform bool u_showWaves;
uniform bool u_showGradient;

uniform float u_radius;
uniform float u_xHalfAngle;
uniform float u_yHalfAngle;
uniform float u_normalDirection;
uniform float u_type;

in vec3 v_position;
in vec3 v_positionWC;
in vec3 v_positionEC;
in vec3 v_normalEC;

vec4 getColor(float sensorRadius, vec3 pointEC) {
  czm_materialInput materialInput;

  vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;
  materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);
  materialInput.str = pointMC / sensorRadius;

  vec3 positionToEyeEC = -v_positionEC;
  materialInput.positionToEyeEC = positionToEyeEC;

  vec3 normalEC = normalize(v_normalEC);
  materialInput.normalEC = u_normalDirection * normalEC;

  czm_material material = czm_getMaterial(materialInput);

  return mix(czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC), vec4(material.diffuse, material.alpha), 0.4);
}

bool isOnBoundary(float value, float epsilon) {
  float width = getIntersectionWidth();
  float tolerance = width * epsilon;

  float delta = max(abs(dFdx(value)), abs(dFdy(value)));
  float pixels = width * delta;
  float temp = abs(value);
  // There are a couple things going on here.
  // First we test the value at the current fragment to see if it is within the tolerance.
  // We also want to check if the value of an adjacent pixel is within the tolerance,
  // but we don't want to admit points that are obviously not on the surface.
  // For example, if we are looking for "value" to be close to 0, but value is 1 and the adjacent value is 2,
  // then the delta would be 1 and "temp - delta" would be "1 - 1" which is zero even though neither of
  // the points is close to zero.
  return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);
}

vec4 shade(bool isOnBoundary) {
  if(u_showIntersection && isOnBoundary) {
    return getIntersectionColor();
  }
  if(u_type == 1.0) {
    return getLineColor();
  }
  return getColor(u_radius, v_positionEC);
}

float ellipsoidSurfaceFunction(vec3 point) {
  vec3 scaled = czm_ellipsoidInverseRadii * point;
  return dot(scaled, scaled) - 1.0;
}

void main() {
  vec3 sensorVertexWC = czm_model[3].xyz;      // (0.0, 0.0, 0.0) in model coordinates
  vec3 sensorVertexEC = czm_modelView[3].xyz;  // (0.0, 0.0, 0.0) in model coordinates

  //vec3 pixDir = normalize(v_position);
  float positionX = v_position.x;
  float positionY = v_position.y;
  float positionZ = v_position.z;

  vec3 zDir = vec3(0.0, 0.0, 1.0);
  vec3 lineX = vec3(positionX, 0, positionZ);
  vec3 lineY = vec3(0, positionY, positionZ);
  float resX = dot(normalize(lineX), zDir);
  if(resX < cos(u_xHalfAngle) - 0.00001) {
    discard;
  }
  float resY = dot(normalize(lineY), zDir);
  if(resY < cos(u_yHalfAngle) - 0.00001) {
    discard;
  }

  float ellipsoidValue = ellipsoidSurfaceFunction(v_positionWC);

  // Occluded by the ellipsoid?
  if(!u_showThroughEllipsoid) {
    // Discard if in the ellipsoid
    // PERFORMANCE_IDEA: A coarse check for ellipsoid intersection could be done on the CPU first.
    if(ellipsoidValue < 0.0) {
      discard;
    }

    // Discard if in the sensor's shadow
    if(inSensorShadow(sensorVertexWC, v_positionWC)) {
      discard;
    }
  }

  // Notes: Each surface functions should have an associated tolerance based on the floating point error.
  bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);
  //isOnEllipsoid = false;
  //if((resX >= 0.8 && resX <= 0.81)||(resY >= 0.8 && resY <= 0.81)){
  /*if(false){
    out_FragColor = vec4(1.0,0.0,0.0,1.0);
  }else{
    out_FragColor = shade(isOnEllipsoid);
  }
  */
  out_FragColor = shade(isOnEllipsoid);

  float pi = 3.1415926535897;
  float radii = sqrt(positionX * positionX + positionY * positionY + positionZ * positionZ);

  // vec4 red = vec4(1.0, 0.0, 0.0, 0.3);
  // vec4 green = vec4(0.0, 1.0, 0.0, 0.3);
  // vec4 blue = vec4(0.0, 0.0, 1.0, 0.3);

  // vec4 c0 = red;
  // vec4 c1 = vec4(red.rgb + green.rgb, 0.3);
  // vec4 c2 = green;
  // vec4 c3 = vec4(green.rgb + blue.rgb, 0.3);
  // vec4 c4 = blue;

  // float s0 = 0.0;
  // float s1 = 0.25;
  // float s2 = 0.5;
  // float s3 = 0.75;
  // float s4 = 1.0;

  // float p0 = 1.0 - step(s1, radii);
  // float p1 = 1.0 - step(s2, radii) - p0;
  // float p2 = 1.0 - step(s3, radii) - p1 - p0;
  // float p3 = 1.0 - p2 - p1 - p0;

  // vec4 m0 = mix(c0, c1, smoothstep(s0, s1, radii));
  // vec4 m1 = mix(c1, c2, smoothstep(s1, s2, radii));
  // vec4 m2 = mix(c2, c3, smoothstep(s2, s3, radii));
  // vec4 m3 = mix(c3, c4, smoothstep(s3, s4, radii));

  // out_FragColor = p0 * m0 + p1 * m1 + p2 * m2 + p3 * m3;

  if(u_showGradient) {
    out_FragColor = getGradientColor(radii);
  }

  if(u_showWaves) {
    float time = fract(czm_frameNumber / 360.0);
    float waves = (sin(12.0 * pi * (radii - time)) + 1.0) / 2.0;
    out_FragColor += out_FragColor * waves;
  }
}`

export const phasedSensorScanFS = `
uniform bool u_showIntersection;
uniform bool u_showThroughEllipsoid;
uniform bool u_showGradient;

uniform float u_radius;
uniform float u_xHalfAngle;
uniform float u_yHalfAngle;
uniform float u_normalDirection;
uniform vec4 u_color;

in vec3 v_position;
in vec3 v_positionWC;
in vec3 v_positionEC;
in vec3 v_normalEC;

vec4 getColor(float sensorRadius, vec3 pointEC) {
  czm_materialInput materialInput;

  vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;
  materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);
  materialInput.str = pointMC / sensorRadius;

  vec3 positionToEyeEC = -v_positionEC;
  materialInput.positionToEyeEC = positionToEyeEC;

  vec3 normalEC = normalize(v_normalEC);
  materialInput.normalEC = u_normalDirection * normalEC;

  czm_material material = czm_getMaterial(materialInput);

  material.diffuse = u_color.rgb;
  material.alpha = u_color.a;

  return mix(czm_phong(normalize(positionToEyeEC), material, czm_lightDirectionEC), vec4(material.diffuse, material.alpha), 0.4);
}

bool isOnBoundary(float value, float epsilon) {
  float width = getIntersectionWidth();
  float tolerance = width * epsilon;

  float delta = max(abs(dFdx(value)), abs(dFdy(value)));
  float pixels = width * delta;
  float temp = abs(value);
  // There are a couple things going on here.
  // First we test the value at the current fragment to see if it is within the tolerance.
  // We also want to check if the value of an adjacent pixel is within the tolerance,
  // but we don't want to admit points that are obviously not on the surface.
  // For example, if we are looking for "value" to be close to 0, but value is 1 and the adjacent value is 2,
  // then the delta would be 1 and "temp - delta" would be "1 - 1" which is zero even though neither of
  // the points is close to zero.
  return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);
}

vec4 shade(bool isOnBoundary) {
  if(u_showIntersection && isOnBoundary) {
    return getIntersectionColor();
  }
  return getColor(u_radius, v_positionEC);
}

float ellipsoidSurfaceFunction(vec3 point) {
  vec3 scaled = czm_ellipsoidInverseRadii * point;
  return dot(scaled, scaled) - 1.0;
}

void main() {
  vec3 sensorVertexWC = czm_model[3].xyz;      // (0.0, 0.0, 0.0) in model coordinates
  vec3 sensorVertexEC = czm_modelView[3].xyz;  // (0.0, 0.0, 0.0) in model coordinates

  //vec3 pixDir = normalize(v_position);
  float positionX = v_position.x;
  float positionY = v_position.y;
  float positionZ = v_position.z;

  vec3 zDir = vec3(0.0, 0.0, 1.0);
  vec3 lineX = vec3(positionX, 0, positionZ);
  vec3 lineY = vec3(0, positionY, positionZ);
  float resX = dot(normalize(lineX), zDir);
  if(resX < cos(u_xHalfAngle) - 0.0001) {
    discard;
  }
  float resY = dot(normalize(lineY), zDir);
  if(resY < cos(u_yHalfAngle) - 0.0001) {
    discard;
  }

  float ellipsoidValue = ellipsoidSurfaceFunction(v_positionWC);

  // Occluded by the ellipsoid?
  if(!u_showThroughEllipsoid) {
    // Discard if in the ellipsoid
    // PERFORMANCE_IDEA: A coarse check for ellipsoid intersection could be done on the CPU first.
    if(ellipsoidValue < 0.0) {
      discard;
    }

    // Discard if in the sensor's shadow
    if(inSensorShadow(sensorVertexWC, v_positionWC)) {
      discard;
    }
  }

  // Notes: Each surface functions should have an associated tolerance based on the floating point error.
  bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);
  out_FragColor = shade(isOnEllipsoid);

  if(u_showGradient) {
    float radii = sqrt(positionX * positionX + positionY * positionY + positionZ * positionZ);
    out_FragColor = getGradientColor(radii);
  }
}`

export const phasedSensorVS = `
in vec4 position;
in vec3 normal;

out vec3 v_position;
out vec3 v_positionWC;
out vec3 v_positionEC;
out vec3 v_normalEC;

void main() {
  gl_Position = czm_modelViewProjection * position;
  v_position = vec3(position);
  v_positionWC = (czm_model * position).xyz;
  v_positionEC = (czm_modelView * position).xyz;
  v_normalEC = czm_normal * normal;
}`

export const conicSensorWave = `
uniform vec4 color; 
uniform float speed; 
uniform float offset; 
uniform float thin;

czm_material czm_getMaterial(czm_materialInput materialInput){
 czm_material material = czm_getDefaultMaterial(materialInput);
 float sp = 1.0/speed;
 vec2 st = materialInput.st;
 float dis = distance(st, vec2(0.5));
 float m = mod(dis + offset, sp);
 float a = step(sp*(1.0-thin), m);

 material.diffuse = color.rgb;
 material.alpha = a * color.a;
 return material;
}`
