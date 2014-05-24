Mesh = function(gl) {
  this.gl = gl;
  this.vertexPositions = [];
  this.vertexNormals = [];
  this.textureCoords = [];
  this.vertexIndices = [];
};
Mesh.prototype.addVertex = function(params) {
  this.vertexPositions.push(params.position[0], params.position[1], params.position[2]);
  this.vertexNormals.push(params.normal[0], params.normal[1], params.normal[2]);
  this.textureCoords.push(params.texture[0], params.texture[1]);
};
Mesh.prototype.addVertexIndices = function(vertexIndices) {
  for (var i in vertexIndices) {
    this.vertexIndices.push(vertexIndices[i]);
  }
};
Mesh.prototype.addFace = function(params) {
  var indexOffset = this.vertexCount();
  for (var v in params.vertices) {
    var vertex = params.vertices[v];
    this.addVertex({
      position: vertex.splice(0, 3),
      normal: params.normal,
      texture: vertex
    });
  }
  for (var i = 0; i < params.vertexIndices.length; i++) {
    params.vertexIndices[i] += indexOffset;
  }
  this.addVertexIndices(params.vertexIndices);
};
Mesh.prototype.vertexCount = function() {
  return this.vertexPositions.length / 3;
};
Mesh.prototype.getVertexPositionBuffer = function() {
  if (!this.vertexPositionBuffer) {
    this.vertexPositionBuffer = this.gl.createBuffer();
    this.vertexPositionBuffer.itemSize = 3;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexPositionBuffer);
    var bufferData = new WebGLFloatArray(this.vertexPositions);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
  }
  return this.vertexPositionBuffer;
};
Mesh.prototype.getVertexNormalBuffer = function() {
  if (!this.vertexNormalBuffer) {
    this.vertexNormalBuffer = this.gl.createBuffer();
    this.vertexNormalBuffer.itemSize = 3;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.vertexNormalBuffer);
    var bufferData = new WebGLFloatArray(this.vertexNormals);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
  }
  return this.vertexNormalBuffer;
};
Mesh.prototype.getTextureCoordBuffer = function() {
  if (!this.textureCoordBuffer) {
    this.textureCoordBuffer = this.gl.createBuffer();
    this.textureCoordBuffer.itemSize = 2;
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
    var bufferData = new WebGLFloatArray(this.textureCoords);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
  }
  return this.textureCoordBuffer;
};
Mesh.prototype.getVertexIndexBuffer = function() {
  if (!this.vertexIndexBuffer) {
    this.vertexIndexBuffer = this.gl.createBuffer();
    this.vertexIndexBuffer.numItems = this.vertexIndices.length;
    this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.vertexIndexBuffer);
    var bufferData = new WebGLUnsignedShortArray(this.vertexIndices);
    this.gl.bufferData(this.gl.ELEMENT_ARRAY_BUFFER, bufferData, this.gl.STATIC_DRAW);
  }
  return this.vertexIndexBuffer;
};
