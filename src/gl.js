
let cv
let gl
let shaderProgram
let uniforms = {}
let vertPos
let posBuf


const floatUniforms = [
  "width", "height", "theta", "w_b", "phi", "l", "maxWidth", "maxHeight"
]

export const setup = (el) => {
  cv = document.createElement('canvas')
  el.appendChild(cv)
  resize()

  gl = cv.getContext("webgl");
  if (!gl) throw Error("WebGL not supported")

  const fs = `
    uniform mediump float height;
    uniform mediump float width;

    uniform mediump float theta; // 15.0/180.0*pi;
    uniform mediump float w_b; // width*(r - 0.5*height*tan(theta))/r;
    uniform mediump float phi; // (width - w_b)/height;
    uniform mediump float l; // height*w_b/(width-w_b) * sin((width-w_b)/height);
    uniform mediump float maxWidth; // l + 2.0*height;
    uniform mediump float maxHeight; // maxWidth*iResolution.y/iResolution.x;

    uniform mediump vec2 iResolution;

    void main( )
    {   
        // Normalized pixel coordinates (from 0 to 1)
        mediump vec2 uv = gl_FragCoord.xy/iResolution;
        uv.y -= 0.333*(maxHeight-height)/maxHeight;  // transform to center instread of bottom
        
        // map from arc coords to img coords
        mediump float R = 0.5*height*w_b / (width - w_b);
        mediump vec2 center = vec2(0.5*maxWidth, -cos(phi)*R);
        mediump vec2 coords = uv*vec2(maxWidth, maxHeight);
        mediump vec2 d = coords-center;
        
        mediump float ang = atan(d.x/d.y)/(2.0*phi) + 0.5;
        mediump vec2 pos = vec2(
            ang*maxWidth,
            (length(d)-R)*maxHeight/height
        );
        if (d.y < 0.0) pos.y = 0.0;
        pos = pos/vec2(maxWidth, maxHeight);
        mediump vec4 col = vec4(0.2,0.2,0.2,1.0);
        bool xOut = abs(pos.x - 0.5) < 0.5;
        bool yOut = abs(pos.y - 0.5) < 0.5;
        if (xOut && yOut) col += vec4(0.0, 0.6, 0.0, 0.0);
        
        // origional label before scaling and arcing
        bool xBoxIn = abs(uv.x - 0.5) < 0.5*width/maxWidth;
        bool yBoxIn = uv.y < height/maxHeight && uv.y > 0.0;
        if (xBoxIn && yBoxIn) col *= vec4(0.8, 0.8, 0.1, 1.0);
        if (xBoxIn && yBoxIn && !(xOut && yOut)) col += vec4(0.16, 0.64, 0.02, 1)/2.0;

        // Output to screen
        gl_FragColor = vec4(col);
    }`

  const vs = `
  attribute mediump vec4 aVertPos;

  void main() {
    gl_Position = aVertPos;
  }`;

  const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fs);
  const vertexShader = loadShader(gl, gl.VERTEX_SHADER, vs);
  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);

  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    throw Error (
      `Unable to initialize the shader program: ${gl.getProgramInfoLog(
        shaderProgram
      )}`
    );
  }

  for (const name of ["iResolution"].concat(floatUniforms)) {
    uniforms[name] = {
      location: gl.getUniformLocation(shaderProgram, name),
      value: 0
    }
  }

  vertPos = gl.getAttribLocation(shaderProgram, "aVertPos");

  posBuf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuf)
  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)
  
  gl.vertexAttribPointer(vertPos, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vertPos)
}

function loadShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw Error (
      `An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`
    );
  }

  return shader;
}

export const resize = () => {
  if (!cv) throw Error("call setup() first")
  cv.width = window.innerWidth * window.devicePixelRatio
  cv.height = window.innerHeight * window.devicePixelRatio
  cv.style.width = `${window.innerWidth}px`
  cv.style.height = `${window.innerHeight}px`

  if (gl) gl.viewport(0, 0, cv.width, cv.height);
}

export const draw = (params) => {
  gl.clearColor(0.2, 0.2, 0.2, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(shaderProgram)

  const u = uniforms
  const theta = params.slope/180.0*Math.PI
  u.theta.value = theta
  const height = params.h
  u.height.value = height
  const width = params.w
  u.width.value = width
  const r = params.r
  const w_b = width*(r - 0.5*height*Math.tan(theta))/r
  u.w_b.value = w_b
  const l = height*w_b/(width-w_b) * Math.sin((width-w_b)/height)
  u.l.value = l
  const maxWidth = l + 2.0*height
  u.maxWidth.value = maxWidth
  u.maxHeight.value = maxWidth*cv.height/cv.width
  const phi = (width - w_b)/height
  u.phi.value = phi

  let abort = false
  let arc = 2.0 * (width - w_b)/(height * Math.PI) * 100
  if (arc > 100) {
    arc = NaN
    abort = true
  }
  params.arc = arc

  let scale = l/width*100
  if (scale <= 0) {
    scale = NaN
    abort = true
  }
  params.scale = scale

  let angle = phi/Math.PI*180
  if (angle >= 90) {
    angle = NaN
    abort = true
  }
  params.angle = angle

  if (abort) return
  
  for (const name of floatUniforms) {
    gl.uniform1f(u[name].location, u[name].value)
  }

  gl.uniform2fv(uniforms.iResolution.location, [cv.width, cv.height])
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}