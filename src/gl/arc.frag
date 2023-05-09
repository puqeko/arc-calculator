uniform mediump float height;  // label height
uniform mediump float width;  // label width
uniform mediump float wb; // width*(r - 0.5*height*tan(theta))/r;
uniform mediump float phi; // (width - w_b)/height;
uniform mediump float maxWidth; // l + 2.0*height;
uniform mediump float maxHeight; // maxWidth*iResolution.y/iResolution.x;

uniform mediump vec2 iResolution;

void main() {   
  // Normalized pixel coordinates (from 0 to 1)
  mediump vec2 uv = gl_FragCoord.xy / iResolution;
  uv.y -= 0.333 * (maxHeight - height) / maxHeight;  // transform to center instread of bottom

  // map from arc coords to img coords
  mediump float R = 0.5 * height * wb / (width - wb);
  mediump vec2 center = vec2(0.5 * maxWidth, -cos(phi) * R);
  mediump vec2 coords = uv * vec2(maxWidth, maxHeight);
  mediump vec2 d = coords - center;

  mediump float ang = atan(d.x / d.y) / (2.0 * phi) + 0.5;
  mediump vec2 pos = vec2(ang * maxWidth, (length(d) - R) * maxHeight / height);
  if(d.y < 0.0)
    pos.y = 0.0; // remove duplicate in -ve
  pos = pos / vec2(maxWidth, maxHeight);
  mediump vec4 col = vec4(0.2, 0.2, 0.2, 1.0);
  bool xOut = abs(pos.x - 0.5) < 0.5;
  bool yOut = abs(pos.y - 0.5) < 0.5;
  if(xOut && yOut)
    col += vec4(0.0, 0.6, 0.0, 0.0);

  // origional label before scaling and arcing
  bool xBoxIn = abs(uv.x - 0.5) < 0.5 * width / maxWidth;
  bool yBoxIn = uv.y < height / maxHeight && uv.y > 0.0;
  if(xBoxIn && yBoxIn)
    col *= vec4(0.8, 0.8, 0.1, 1.0);
  if(xBoxIn && yBoxIn && !(xOut && yOut))
    col += vec4(0.16, 0.64, 0.02, 1) / 2.0;

  // Output to screen
  gl_FragColor = vec4(col);
}