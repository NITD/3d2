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

var activeFaces = [];
var extrudeVertices = [];
var extrudeVerticesMap = [];
var selectMultipleFaces = false;

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

function checkNormal(face1, face2) {
	console.log(face1.normal);
	console.log(face2.normal);
	if (face1.normal.equals(face2.normal)) {
		return true;
	}
	return false;
}

function checkCommonVertices(aExtrudeVerticesMap, aFaceVertices) {
	console.log(aExtrudeVerticesMap);
	console.log(aFaceVertices);
	var matchString = [];
	var count = 0;
	for (var i = 0; i < 3; i = i + 1) {
		var temp;
		if ((temp = aExtrudeVerticesMap[aFaceVertices[i]]) != undefined) {
			matchString[count++] = temp;
			//console.log(matchString);
			//console.log(count);
		}
		else {
			matchString[2] = i;
			//console.log(aExtrudeVerticesMap[aFaceVertices[0]]);
			//console.log(matchString);
		}
	}
	//console.log(matchString);
	//console.log(count);
	return {result: (count == 2), matchString: (count == 2) ? matchString : []};
}

function arrangeVertices(aExtrudeVertices, aExtrudeVerticesMap, aFaceVertices, aMatchString) {
	if (!aExtrudeVertices.length) {
		for (var i = 0; i < 3; i = i + 1) {
			aExtrudeVertices.push(aFaceVertices[i]);
			aExtrudeVerticesMap[aFaceVertices[i]] = i;
		}
	}
	else {
		if (!(aMatchString[0] == 0 && aMatchString[1] == aExtrudeVertices.length - 1)) {
			var tempExtrudeVertices = [];
			for (var i = aMatchString[1]; i < aExtrudeVertices.length; i = i + 1) {
				tempExtrudeVertices.push(aExtrudeVertices[i]);
			}
			for (var i = 0; i <= aMatchString[0]; i = i + 1) {
				tempExtrudeVertices.push(aExtrudeVertices[i]);
			}
			tempExtrudeVertices.push(aFaceVertices[aMatchString[2]]);
			aExtrudeVertices = tempExtrudeVertices;
		}
		for (var i = 0; i < aExtrudeVertices.length; i = i + 1) {
			aExtrudeVerticesMap[aExtrudeVertices[i]] = i;
		}
	}
	return {extrudeVertices: aExtrudeVertices, extrudeVerticesMap: aExtrudeVerticesMap};
}

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
            if (!activeFaces.length) return;
            //extrude(activeFace);
            break;
        case 17:
        	selectMultipleFaces = true;
        	break;
    }
}
window.addEventListener('keydown', onKeyDown, false);

function onKeyUp(event) {
	switch(event.keyCode) {
		case 17:
			selectMultipleFaces = false;
			break;
	}
}
window.addEventListener('keyup', onKeyUp, false);

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
    var checkCommonVerticesResult = {result: false, matchString: []};
    if (!selectMultipleFaces || !activeFaces.length) {
    	activeFaces = [];
    	extrudeVertices = [];
    	extrudeVerticesMap = [];
    	setDefaultVertexColors(geometry);
    }
    else {
    	checkCommonVerticesResult = checkCommonVertices(extrudeVerticesMap, [face.a, face.b, face.c]);
    	if (!(checkNormal(activeFaces[0], face) && 
    		  checkCommonVerticesResult.result)) {
    		return;
    	}
    }
	activeFaces.push(face);
    face.vertexColors[0].setRGB(1, 0.7, 0.7);
    face.vertexColors[1].setRGB(1, 0.7, 0.7);
    face.vertexColors[2].setRGB(1, 0.7, 0.7);
    geometry.colorsNeedUpdate = true;
    var arrangeVerticesResult = arrangeVertices(extrudeVertices, extrudeVerticesMap,
    	[face.a, face.b, face.c],
    	checkCommonVerticesResult.matchString);
    extrudeVertices = arrangeVerticesResult.extrudeVertices;
    extrudeVerticesMap = arrangeVerticesResult.extrudeVerticesMap;
    console.log(extrudeVertices);
    console.log(extrudeVerticesMap);
}
window.addEventListener('mousedown', onMouseDown, false);

function animate() {
    mesh.rotation.x += 0.01;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();