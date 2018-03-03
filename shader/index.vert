attribute vec3 aVertexPosition;

uniform mat4 projectionMat;
uniform mat4 viewMat;
uniform mat4 modelMat;

void main(void) {
    gl_Position = projectionMat * viewMat * modelMat * vec4(aVertexPosition, 1.0);
}