var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

function setDefaultVertexColors(geometry) {
    for (var i = 0; i < geometry.faces.length; i++) {
        face = geometry.faces[i];
        face.vertexColors[0].setRGB(0.67, 0.67, 0.67);
        face.vertexColors[1].setRGB(0.67, 0.67, 0.67);
        face.vertexColors[2].setRGB(0.67, 0.67, 0.67);
    }
}

var geometry = new THREE.BoxGeometry(2, 2, 2);
for (var i = 0; i < geometry.faces.length; i++) {
    face = geometry.faces[i];
    face.vertexColors[0] = new THREE.Color(0xaaaaaa);
    face.vertexColors[1] = new THREE.Color(0xaaaaaa);
    face.vertexColors[2] = new THREE.Color(0xaaaaaa);
}

var materials = [
    new THREE.MeshLambertMaterial({ vertexColors: THREE.VertexColors }),
    new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
];
var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, materials);
scene.add(mesh);

var light = new THREE.DirectionalLight(0xffffff);
light.position.set(0, 1, 0);
scene.add(light);

var objects = [];
objects.push(mesh);

var activeFace = null;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function makeFace(indexa, indexb, indexc) {
    var face = new THREE.Face3(indexa, indexb, indexc);
    face.vertexColors[0] = new THREE.Color(0xaaaaaa);
    face.vertexColors[1] = new THREE.Color(0xaaaaaa);
    face.vertexColors[2] = new THREE.Color(0xaaaaaa);
    return face;
}

function extrude(face) {
    var a = geometry.vertices[face.a];
    b = geometry.vertices[face.b];
    var c = geometry.vertices[face.c];
    var aclone = a.clone();
    var bclone = b.clone();
    var cclone = c.clone();
    var normal = face.normal;
    console.log(normal);

    aclone.add(normal);
    bclone.add(normal);
    cclone.add(normal);

    geometry.vertices.push(aclone);
    geometry.vertices.push(bclone);
    geometry.vertices.push(cclone);

    var indexa = geometry.vertices.length - 3;
    var indexb = indexa + 1;
    var indexc = indexa + 2;

    geometry.faces.push(makeFace(indexa, indexb, indexc));
    geometry.faces.push(makeFace(indexa, face.a, face.b));
    geometry.faces.push(makeFace(indexa, face.b, indexb));
    geometry.faces.push(makeFace(indexb, face.b, face.c));
    geometry.faces.push(makeFace(indexb, face.c, indexc));
    geometry.faces.push(makeFace(indexc, face.c, face.a));
    geometry.faces.push(makeFace(indexc, face.a, indexa));

    geometry.computeFaceNormals();
    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 69:
            if (activeFace == null) return;
            extrude(activeFace);
            break;
    }
}
window.addEventListener('keydown', onKeyDown, false);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

function onMouseDown(event) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects, true);
    if (!intersects.length) {
        return;
    }
    var intersect = intersects[0];
    var face = intersect.face;
    activeFace = face;
    setDefaultVertexColors(geometry);
    face.vertexColors[0].setRGB(1, 0.7, 0.7);
    face.vertexColors[1].setRGB(1, 0.7, 0.7);
    face.vertexColors[2].setRGB(1, 0.7, 0.7);
    geometry.colorsNeedUpdate = true;

}
window.addEventListener('mousedown', onMouseDown, false);

function animate() {
    mesh.rotation.x += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
