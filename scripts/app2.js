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
	return ((face1.normal.x == face2.normal.x) && (face1.normal.y == face2.normal.y) && (face1.normal.z == face2.normal.z));
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
	console.log(aExtrudeVertices);
	console.log(aFaceVertices);
	console.log(aMatchString);
	if (!aExtrudeVertices.length) {
		for (var i = 0; i < 3; i = i + 1) {
			aExtrudeVertices.push(aFaceVertices[i]);
			aExtrudeVerticesMap[aFaceVertices[i]] = i;
		}
	}
	else {
		var lower = (aMatchString[0] < aMatchString[1]) ? aMatchString[0] : aMatchString[1];
		var upper = (aMatchString[0] > aMatchString[1]) ? aMatchString[0] : aMatchString[1];
		if (!(lower == 0 && upper == aExtrudeVertices.length - 1)) {
			var tempExtrudeVertices = [];
			for (var i = upper; i < aExtrudeVertices.length; i = i + 1) {
				tempExtrudeVertices.push(aExtrudeVertices[i]);
			}
			for (var i = 0; i <= lower; i = i + 1) {
				tempExtrudeVertices.push(aExtrudeVertices[i]);
			}
			aExtrudeVertices = tempExtrudeVertices;
		}
		aExtrudeVertices.push(aFaceVertices[aMatchString[2]]);
		for (var i = 0; i < aExtrudeVertices.length; i = i + 1) {
			aExtrudeVerticesMap[aExtrudeVertices[i]] = i;
		}
	}
	//console.log(aExtrudeVertices);
	return {extrudeVertices: aExtrudeVertices, extrudeVerticesMap: aExtrudeVerticesMap};
}

function makeFace(indexa, indexb, indexc) {
    var face = new THREE.Face3(indexa, indexb, indexc);
    face.vertexColors[0] = new THREE.Color(0xaaaaaa);
    face.vertexColors[1] = new THREE.Color(0xaaaaaa);
    face.vertexColors[2] = new THREE.Color(0xaaaaaa);
    return face;
}

function extrude(aVertices, aNormal) {
	aVerticesClone = [];
	for (var i = 0; i < aVertices.length; i = i + 1) {
		aVerticesClone.push(geometry.vertices[aVertices[i]].clone());
		aVerticesClone[i].add(aNormal);
		geometry.vertices.push(aVerticesClone[i]);
	}

	var vertexStartIndex = geometry.vertices.length - aVertices.length;
    for (var i = 0; i < activeFaces.length; i = i + 1) {
        var a = vertexStartIndex + extrudeVerticesMap[activeFaces[i].a];
        var b = vertexStartIndex + extrudeVerticesMap[activeFaces[i].b];
        var c = vertexStartIndex + extrudeVerticesMap[activeFaces[i].c];
        geometry.faces.push(makeFace(a, b, c));
    }
    /*
	for (var i = vertexStartIndex + 1; i < geometry.vertices.length - 1; i = i + 1) {
		geometry.faces.push(makeFace(vertexStartIndex, i, i + 1));
	}*/
	for (i = vertexStartIndex, j = 0; i < geometry.vertices.length; i = i + 1, j = j + 1) {
		if (i == geometry.vertices.length - 1) {
			geometry.faces.push(makeFace(i, aVertices[j], aVertices[0]));
			geometry.faces.push(makeFace(aVertices[0], vertexStartIndex, i));
		} else {
			geometry.faces.push(makeFace(i, aVertices[j], aVertices[j + 1]));
			geometry.faces.push(makeFace(aVertices[j + 1], i + 1, i));
		}
	}
    geometry.computeFaceNormals();
    geometry.verticesNeedUpdate = true;
    geometry.elementsNeedUpdate = true;
    geometry.normalsNeedUpdate = true;
    geometry.colorsNeedUpdate = true;
}

var rotateX = 0;
var rotateZ = 0;
var rotateY = 0;

function onKeyDown(event) {
    switch (event.keyCode) {
        case 69:
            if (!activeFaces.length) return;
            extrude(extrudeVertices, activeFaces[activeFaces.length - 1].normal);
            activeFaces = [];
            extrudeVertices = [];
            extrudeVerticesMap = [];
            break;
        case 17:
        	selectMultipleFaces = true;
        	//console.log(selectMultipleFaces);
        	break;
        case 88:
        	rotateX = 0.1;
        	break;
        case 89:
        	rotateY = 0.1;
        	break;
        case 90:
        	rotateZ = 0.1;
        	break;
        case 77:
        	rotateX = rotateY = rotateZ = 0;
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
    mesh.rotation.x += rotateX;
    mesh.rotation.y += rotateY;
    mesh.rotation.z += rotateZ;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
}
animate();