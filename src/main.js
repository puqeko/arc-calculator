import { Pane } from 'tweakpane'

import { setup, draw, resize, clear, canvas } from './gl/gl'

const values = {
  
  // inputs
  width: 130,
  height: 30,
  r: 50,
  slope: 5,

  // outputs
  scale: NaN,
  arc: NaN,
  angle: NaN,

  // internal shader uniforms
  maxWidth: NaN,
  maxHeight: NaN,
  phi: NaN,
  l: NaN,
  wb:  NaN,
}

const calc = () => {
  const theta = values.slope / 180.0 * Math.PI
  const height = values.height
  const width = values.width
  const r = values.r
  const wb = width * (r - 0.5 * height * Math.tan(theta)) / r
  const w = width - wb
  const l = height * wb / w * Math.sin(w / height)
  const maxWidth = width + height
  const phi = w / height

  values.wb = wb
  values.maxWidth = maxWidth
  values.maxHeight = maxWidth * canvas.height / canvas.width
  values.phi = phi

  let shouldDraw = true
  let arc = 2.0 * w / (height * Math.PI) * 100
  if (arc > 100) {
    arc = NaN
    shouldDraw = false
  }

  let scale = l / width * 100
  if (scale <= 0) {
    scale = NaN
    shouldDraw = false
  }

  let angle = phi / Math.PI * 180
  if (angle >= 90) {
    angle = NaN
    shouldDraw = false
  }

  values.arc = arc
  values.scale = scale
  values.angle = angle

  return shouldDraw
}

const redraw = () => {
  clear()
  if (calc()) draw(values)
}

const pane = new Pane({title: 'Jims Arc Calculator 😎'})
pane.on('change', redraw)
pane.element.style.userSelect = 'none' // stop label text being selected on dbl clk

// inputs
pane.addInput(values, 'width', {
  label: 'Width',
  min: 1e-8
})
pane.addInput(values, 'height', {
  label: 'Height',
  min: 1e-8
})
pane.addInput(values, 'r', {
  label: 'Mid Radius',
  min: 1e-8
})
pane.addInput(values, 'slope', {
  label: 'Slope ˚',
  min: 1e-8,
  max: 85
})

// outputs
pane.addMonitor(values, 'scale', { label: 'Scale H %' })
pane.addMonitor(values, 'arc', { label: 'Arc %' })
pane.addMonitor(values, 'angle', { label: 'Angle ˚' })

// init reference display
const containerEl = document.getElementById('container')
setup(containerEl)
redraw()

window.addEventListener('resize', () => {
  resize();
  clear();
  draw(values)
})
