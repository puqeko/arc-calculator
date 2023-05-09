import { Pane } from 'tweakpane'

import { setup, draw, resize } from './gl'

const pane = new Pane({
  title: "Jims Arc Calculator 😎"
})
pane.element.style.userSelect = 'none' // stop label text being selected on dbl clk

const PARAMS = {
  w: 130,
  h: 30,
  r: 50,
  slope: 5,
  scale: 0,
  arc: 0,
  angle: 0,
  w_b: 0,
  l: 0,
}

const redraw = () => {
  draw(PARAMS)
}

pane.addInput(PARAMS, 'w', {
  label: 'Width',
  min: 1e-8
}).on('change', redraw)

pane.addInput(PARAMS, 'h', {
  label: 'Height',
  min: 1e-8
}).on('change', redraw)

pane.addInput(PARAMS, 'r', {
  label: 'Mid Radius',
  min: 1e-8
}).on('change', redraw)

pane.addInput(PARAMS, 'slope', {
  label: 'Slope ˚',
  min: 1e-8,
  max: 85
}).on('change', redraw)

pane.addMonitor(PARAMS, 'scale', {label:'Scale H %'});
pane.addMonitor(PARAMS, 'arc', {label:'Arc %'});
pane.addMonitor(PARAMS, 'angle', {label:'Angle ˚'});

const containerEl = document.getElementById("container")
setup(containerEl)
draw(PARAMS)

window.addEventListener('resize', () => {resize(); draw(PARAMS)})