var scene = new THREE.Scene();

var camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 10, 10);
camera.lookAt(scene.position);

var renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0xffffff);
document.body.appendChild(renderer.domElement);

var geometry = new THREE.BoxGeometry(2, 2, 2);

var materials = [
    new THREE.MeshBasicMaterial({ color: 0xaaaaaa }),
    new THREE.MeshBasicMaterial({ color: 0x000000, wireframe: true })
];
var mesh = THREE.SceneUtils.createMultiMaterialObject(geometry, materials);
scene.add(mesh);

var objects = [];
objects.push(mesh);

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var activeVertex = null;
var actualActiveVertex = null;
var activeAxis = 'x';

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}
window.addEventListener('mousemove', onMouseMove, false);

function minDistanceVertex(point, face) {
    var a = geometry.vertices[face.a].clone().applyMatrix4(mesh.matrixWorld);
    var b = geometry.vertices[face.b].clone().applyMatrix4(mesh.matrixWorld);
    var c = geometry.vertices[face.c].clone().applyMatrix4(mesh.matrixWorld);
    a = point.distanceTo(a);
    b = point.distanceTo(b);
    c = point.distanceTo(c);
    if (a <= b && a <= c) return geometry.vertices[face.a];
    else if (b <= c) return geometry.vertices[face.b];
    return geometry.vertices[face.c];
}

function createVertexMarker() {
    var geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
    var material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    var mesh = new THREE.Mesh(geometry, material);
    return mesh;
}

function onKeyDown(event) {
    switch (event.keyCode) {
        case 88:
            activeAxis = 'x';
            break;
        case 89:
            activeAxis = 'y';
            break;
        case 90:
            activeAxis = 'z';
            break;
        case 38:
        case 39:
            if (activeVertex) {
                actualActiveVertex[activeAxis] += 0.1;
                geometry.verticesNeedUpdate = true;
                activeVertex.position[activeAxis] += 0.1;
            }
            break;
        case 37:
        case 40:
            if (activeVertex) {
                actualActiveVertex[activeAxis] -= 0.1;
                geometry.verticesNeedUpdate = true;
                activeVertex.position[activeAxis] -= 0.1;
            }
            break;
    }
}
window.addEventListener('keydown', onKeyDown, false);

function onMouseDown(event) {
    raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(objects, true);
    if (!intersects.length) {
        if (activeVertex) mesh.remove(activeVertex);
        activeVertex = null;
        return;
    }
    var intersect = intersects[0];
    var face = intersect.face;
    if (activeVertex) mesh.remove(activeVertex);
    activeVertex = createVertexMarker();
    var minDistanceVertexPoint = minDistanceVertex(intersect.point, face);
    activeVertex.position.set(minDistanceVertexPoint.x, minDistanceVertexPoint.y, minDistanceVertexPoint.z);
    actualActiveVertex = minDistanceVertexPoint;
    mesh.add(activeVertex);
}
window.addEventListener('mousedown', onMouseDown, false);

function animate() {
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();
