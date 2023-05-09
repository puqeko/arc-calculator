attribute mediump vec4 aVertPos;

void main() {
  gl_Position = aVertPos;  // pass thru as all work done in fragment shader
}