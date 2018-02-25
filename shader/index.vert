attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 mMatrix;

void main(void) {
    gl_Position = mMatrix * uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);
}