import * as THREE from 'https://threejsfundamentals.org/threejs/resources/threejs/r127/build/three.module.js';

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );

const groups = [];
const cubes = [];
const spheres = [];
let edges = [];
let selected = [];
let nowResizing = null;
let distance = 0;

function calculateCubeCorners(size, position) {
    const halfSize = size / 2;

    const corners = [
        { x: position.x - halfSize, y: position.y - halfSize, z: position.z - halfSize },
        { x: position.x + halfSize, y: position.y - halfSize, z: position.z - halfSize },
        { x: position.x - halfSize, y: position.y + halfSize, z: position.z - halfSize },
        { x: position.x + halfSize, y: position.y + halfSize, z: position.z - halfSize },
        { x: position.x - halfSize, y: position.y - halfSize, z: position.z + halfSize },
        { x: position.x + halfSize, y: position.y - halfSize, z: position.z + halfSize },
        { x: position.x - halfSize, y: position.y + halfSize, z: position.z + halfSize },
        { x: position.x + halfSize, y: position.y + halfSize, z: position.z + halfSize },
    ];

    return corners;
} 

function createCubeGroup(size, pos) {
    const cubeGeometry = new THREE.BoxGeometry(size, size, size);
    const cubeGroup = new THREE.Group();
    const cubeMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.userData.type = "cube";
    cubeGroup.userData.uuid = cube.uuid;
    cube.position.set(pos.x, pos.y, pos.z);
    cubeGroup.add(cube);
    cubes.push(cube);

    calculateCubeCorners(size, pos).forEach(cornerPos => {
        const sphereGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xff0000,
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(cornerPos.x, cornerPos.y, cornerPos.z);
        sphere.userData.forCube = cube.uuid;
        sphere.userData.type = "sphere";
        spheres.push(sphere);
        cubeGroup.add(sphere);
    })

    const edgesGeometry = new THREE.EdgesGeometry(cube.geometry);
    const edgesMaterial = new THREE.LineBasicMaterial({color: 0x0000ff});
    const edge = new THREE.LineSegments(edgesGeometry, edgesMaterial);
    edge.renderOrder = 1;
    edge.userData.forCube = cube.uuid;

    edge.position.copy(cube.position);
    edge.rotation.copy(cube.rotation);
    edge.scale.copy(cube.scale);

    edges.push(edge);
    cubeGroup.add(edge);

    return cubeGroup;
}

function highlightSelectedCubes() {
    selected.forEach(id => edges.find(edge => edge.userData.forCube === id).visible = true);
    edges.forEach(edge => {
        if(selected.some(id => edge.userData.forCube === id)) {
            edge.visible = true;
        } else {
            edge.visible = false;
        }
    })
}

function distanceFromRayToPoint(ray, point) {
    if(point instanceof THREE.Vector3) {
        const pointOnRay = new THREE.Vector3();
        ray.closestPointToPoint(point, pointOnRay);
    
        const distance = point.distanceTo(pointOnRay);
        return distance;
    }
    return 0;
}

function onMouseDown(event) {
    const raycaster = raycast(event.clientX, event.clientY);
    const intersects = raycaster.intersectObjects([...spheres, ...cubes]);
    const intersected = intersects.length > 0 ? intersects[0].object : null;

    if (intersected?.userData?.type === "sphere") {
        nowResizing = intersected.userData.forCube;
        distance = distanceFromRayToPoint(raycaster.ray, cubes.find(c => c.uuid === nowResizing));
    } else if (intersected?.userData?.type === "cube") {
        if(selected.some(e => e == intersected.uuid)) {
            selected = selected.filter(e => e !== intersected.uuid);
        } else {
            selected.push(intersected.uuid);
        }
    } else if (intersected === null) {
        selected = [];
    }
}

function onMouseMove(event) {
    if (nowResizing) {
        const raycaster = raycast(event.clientX, event.clientY);
        const cube = cubes.find(c => c.uuid === nowResizing);
        
        if (!cube) {
            console.error('Cube not found.');
            return;
        }

        const newDistance = distanceFromRayToPoint(raycaster.ray, cube.position);

        if (distance === undefined) {
            distance = newDistance;
            return;
        }

        const group = groups.find(g => g.userData.uuid === cube.uuid);

        if (newDistance > distance) {
            group.scale.multiplyScalar(1.01); 
        } else if (newDistance < distance) {
            group.scale.divideScalar(1.01); 
        }

        distance = newDistance;
    }
}

function onMouseUp() {
    highlightSelectedCubes();
    nowResizing = null;
    distance = 0;
}

function raycast(clientX, clientY) {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    mouse.x = (clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    return raycaster;
}

window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('mouseup', onMouseUp);


function main() {
  camera.position.z = 5;
  
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);


    for (let i = 0; i < 3; i++) {
        const cubeGroup = createCubeGroup(1, {x: 0, y: i*2 - 2, z: 0});
        groups.push(cubeGroup);
        scene.add(cubeGroup);
    }

    const animate = () => {
      requestAnimationFrame(animate);
    
      renderer.render(scene, camera);
    };
    
    animate();
}

main();