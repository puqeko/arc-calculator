import fragProgramStr from './arc.frag'
import vertProgramStr from './arc.vert'

export let canvas // canvas
let gl // WebGL context
let sp // shader program
let vertexPositions
let positionBuffer

const uniformLocations = {} // locations of uniform vars in shader programs
const floatUniforms = [
  'width',
  'height',
  'wb',
  'phi',
  'maxWidth',
  'maxHeight'
]
const otherUniforms = [
  'iResolution'
]

export const setup = (el) => {
  canvas = document.createElement('canvas')
  el.appendChild(canvas)

  gl = canvas.getContext('webgl')
  if (!gl) {
    console.error('WebGL not supported')
    return
  }
  resize()

  const fs = loadShader(gl, gl.FRAGMENT_SHADER, fragProgramStr)
  const vs = loadShader(gl, gl.VERTEX_SHADER, vertProgramStr)
  sp = gl.createProgram()
  gl.attachShader(sp, vs)
  gl.attachShader(sp, fs)
  gl.linkProgram(sp)

  if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) {
    console.error(`Unable to initialize the shader program: ${gl.getProgramInfoLog(sp)}`)
    return
  }

  for (const name of otherUniforms.concat(floatUniforms)) {
    uniformLocations[name] = gl.getUniformLocation(sp, name)
  }

  vertexPositions = gl.getAttribLocation(sp, 'aVertPos')

  positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)

  const positions = [1.0, 1.0, -1.0, 1.0, 1.0, -1.0, -1.0, -1.0]
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  gl.vertexAttribPointer(vertexPositions, 2, gl.FLOAT, false, 0, 0)
  gl.enableVertexAttribArray(vertexPositions)
}

function loadShader (gl, type, source) {
  const shader = gl.createShader(type)
  gl.shaderSource(shader, source)
  gl.compileShader(shader)

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) { console.error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`) }

  return shader
}

export const resize = () => {
  if (!canvas) {
    console.error('call setup() first')
    return
  }
  canvas.width = window.innerWidth * window.devicePixelRatio
  canvas.height = window.innerHeight * window.devicePixelRatio
  canvas.style.width = `${window.innerWidth}px`
  canvas.style.height = `${window.innerHeight}px`

  if (gl) gl.viewport(0, 0, canvas.width, canvas.height)
}

export const clear = () => {
  if (!gl) {
    console.error('call setup() first')
    return
  }

  gl.clearColor(0.2, 0.2, 0.2, 1.0)
  gl.clear(gl.COLOR_BUFFER_BIT)
}

export const draw = (values) => {
  gl.useProgram(sp)
  for (const name of floatUniforms) 
    gl.uniform1f(uniformLocations[name], values[name])
  gl.uniform2fv(uniformLocations.iResolution, [canvas.width, canvas.height])
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
}
