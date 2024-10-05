import * as THREE from "three";
import { OrbitControls } from "jsm/controls/OrbitControls.js";

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Starfield background
const starGeometry = new THREE.BufferGeometry();
const starCount = 30000;
const positions = new Float32Array(starCount * 3);
for (let i = 0; i < starCount * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100; // Random positions in a large area
}
starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
const starMaterial = new THREE.PointsMaterial({ color: 0x888888, size: 0.05 }); // Change size here
const stars = new THREE.Points(starGeometry, starMaterial);
scene.add(stars);

// Create the Sun
const sunGeometry = new THREE.SphereGeometry(0.06, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Planet parameters (e: eccentricity, a: semi-major axis, i: inclination)
const planets = [
    { full_name: 'Mercury', a: 0.387, e: 0.206, per_y: 0.241, size: 0.02, color: 0xaaaaaa, i: 7.0, ma: 3.050, w: 0.509, om: 0.842 },
    { full_name: 'Venus', a: 0.723, e: 0.007, per_y: 0.615, size: 0.04, color: 0xffcc00, i: 3.39, ma: 0.875, w: 0.960, om: 1.338 },
    { full_name: 'Earth', a: 1.000, e: 0.017, per_y: 1.000, size: 0.04, color: 0x0000ff, i: 0.0, ma: 1.754, w: 1.794, om: 3.050 },
    { full_name: 'Mars', a: 1.524, e: 0.093, per_y: 1.881, size: 0.03, color: 0xff0000, i: 1.85, ma: 6.196, w: 4.994, om: 0.866 },
    {full_name: 'Jupiter', a: 5.204, e: 0.048, per_y: 11.861, size: 0.11, color: 0xffcc66, i: 1.303, ma: 0.048, w: 1.303, om: 2.856 }    
];

const PHAs = [
    { full_name: '1566 Icarus (1949 MA)', a: 1.078, e: 0.8270, i: 22.80, ma: 160.86, w: 31.43, om: 87.95, per_y: 1.12 },
    { full_name: '  1620 Geographos (1951 RA)', a: 1.246, e: 0.3356, i: 13.34, ma: 289.36, w: 277.01, om: 337.15, per_y: 1.39 } ,     
    { full_name: '  1862 Apollo (1932 HA)', a: 1.471, e: 0.5599, i: 6.35, ma: 252.87, w: 286.03, om: 35.56, per_y: 1.78 } ,
    
];
 
// Function to calculate the position using the elliptical orbit formula
function ellipticalOrbit(a, e, i, om, w, ma) {
    const toRadians = degrees => degrees * (Math.PI / 180);
    
    const i_rad = toRadians(i);
    const om_rad = toRadians(om);
    const w_rad = toRadians(w);
    const ma_rad = toRadians(ma);
    
    const r = (a * (1 - Math.pow(e, 2))) / (1 + e * Math.cos(ma_rad));
    
    const x_prime = r * Math.cos(ma_rad);
    const y_prime = r * Math.sin(ma_rad);
    
    const x_double_prime = x_prime * Math.cos(w_rad) - y_prime * Math.sin(w_rad);
    const y_double_prime = x_prime * Math.sin(w_rad) + y_prime * Math.cos(w_rad);
    
    const z = y_double_prime * Math.sin(i_rad);
    const y_triple_prime = y_double_prime * Math.cos(i_rad);
    
    const x = x_double_prime * Math.cos(om_rad) - y_triple_prime * Math.sin(om_rad);
    const y = x_double_prime * Math.sin(om_rad) + y_triple_prime * Math.cos(om_rad);
    
    return { x, y, z };
}

// Create planet meshes
const planetMeshes = planets.map(planet => {
    const geometry = new THREE.SphereGeometry(planet.size, 16, 16);
    const material = new THREE.MeshBasicMaterial({ color: planet.color });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    createOrbitPath(planet.a, planet.e, planet.i, planet.w, planet.om, 0xffffff);

    const label = createLabel(planet.full_name, new THREE.Vector3(planet.a, 0, 0));
    label.position.z += 0.1; // Offset for visibility
    scene.add(label);

    return { mesh, ...planet, label };
});

const PHAMeshes = PHAs.map(PHA => {
    const geometry1 = new THREE.SphereGeometry(0.006, 16, 16);
    const material1 = new THREE.MeshBasicMaterial({ color: 0xcf5f57 });
    const mesh = new THREE.Mesh(geometry1, material1);
    scene.add(mesh);

    createOrbitPath(PHA.a, PHA.e, PHA.i, PHA.w, PHA.om);

    const label = createLabel(PHA.full_name, new THREE.Vector3(PHA.a, 0, 0));
    label.position.z += 0.1; // Offset for visibility
    scene.add(label);

    return { mesh, ...PHA, label };
});

// Helper function to create orbit path
function createOrbitPath(a, e, i, w, om, color, opacity = 1) {
    const orbitPoints = [];
    const numPoints = 100;
    for (let j = 0; j < numPoints; j++) {
        const ma = (2 * Math.PI * j) / numPoints;
        const { x, y, z } = ellipticalOrbit(a, e, i, om, w, ma * (180 / Math.PI));
        orbitPoints.push(new THREE.Vector3(x, y, z));
    }

    const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({
        color: 0xcf5f57,
        opacity: opacity, // Use the passed opacity value
        transparent: true // Set to true to enable opacity effect
    });
    const orbitLine = new THREE.LineLoop(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
}


// Helper function to create label
function createLabel(text, position) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 20px Arial';
    context.fillStyle = 'white';
    context.opacity = 10
    context.fillText(text, 10, 50);

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.25, 1);
    sprite.position.copy(position);

    return sprite;
}

// Camera setup
camera.position.z = 3;
camera.position.y = 0.5;

// Speed control UI
let time = 0;
let speedFactor = 0.0025;

const speedControl = document.createElement('input');
speedControl.type = 'range';
speedControl.min = -2;
speedControl.max = 2;
speedControl.step = 0.000005;
speedControl.value = speedFactor;
speedControl.style.position = 'absolute';
speedControl.style.top = '90px';
speedControl.style.left = '10px';
speedControl.style.padding = '10px 20px';
speedControl.style.fontSize = '16px';
speedControl.style.cursor = 'pointer';
document.body.appendChild(speedControl);

speedControl.addEventListener('input', (event) => {
    speedFactor = parseFloat(event.target.value);
});

const toggleOrbitButton = document.createElement('button');
toggleOrbitButton.innerText = 'Toggle Orbits';
toggleOrbitButton.style.position = 'absolute';
toggleOrbitButton.style.top = '140px';
toggleOrbitButton.style.left = '10px';
toggleOrbitButton.style.padding = '10px 20px';
toggleOrbitButton.style.fontSize = '16px';
toggleOrbitButton.style.cursor = 'pointer';
document.body.appendChild(toggleOrbitButton);

let orbitsVisible = false; // Initial state of orbit visibility

toggleOrbitButton.addEventListener('click', () => {
    orbitsVisible = !orbitsVisible; // Toggle state
    updateOrbitVisibility(orbitsVisible); // Update visibility
});

function updateOrbitVisibility(visible) {
    const orbitLines = scene.children.filter(child => child instanceof THREE.LineLoop);
    orbitLines.forEach(line => {
        line.visible = visible; // Set visibility
    });
}

const toggleLabelButton = document.createElement('button');
toggleLabelButton.innerText = 'Toggle Labels';
toggleLabelButton.style.position = 'absolute';
toggleLabelButton.style.top = '210px';
toggleLabelButton.style.left = '10px';
toggleLabelButton.style.padding = '10px 20px';
toggleLabelButton.style.fontSize = '16px';
toggleLabelButton.style.cursor = 'pointer';
document.body.appendChild(toggleLabelButton);

let labelVisible = true; // Initial state of label visibility

toggleLabelButton.addEventListener('click', () => {
    labelVisible = !labelVisible; // Toggle state
    updateLabelVisibility(labelVisible); // Update visibility
});

function updateLabelVisibility(visible) {
    if (typeof visible !== 'boolean') {
        console.error('Parameter "visible" must be a boolean.');
        return;
    }

    const labels = scene.children.filter(child => child instanceof THREE.Sprite);
    
    labels.forEach(sprite => {
        sprite.visible = visible; // Set visibility
    });

    console.log(`Labels visibility set to: ${visible}`);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    time += 0.01 * speedFactor;

    PHAMeshes.forEach(({ mesh, a, e, per_y, i, w, om, label }) => {
        const ma = (2 * Math.PI * time) / per_y;
        const { x, y, z } = ellipticalOrbit(a, e, i, om, w, ma * (180 / Math.PI));
        mesh.position.set(x, y, z);
        label.position.set(x, y, z);
    });

    planetMeshes.forEach(({ mesh, a, e, per_y, i, w, om, label }) => {
        const ma = (2 * Math.PI * time) / per_y;
        const { x, y, z } = ellipticalOrbit(a, e, i, om, w, ma * (180 / Math.PI));
        mesh.position.set(x, y, z);
        label.position.set(x, y, z);
    });
    
    stars.rotation.y += 0.0001; // Add this in the animate function


    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Add simple interactivity
planetMeshes.forEach(({ mesh, full_name }) => {
    mesh.userData = { full_name };
});

PHAMeshes.forEach(({ mesh, full_name }) => {
    mesh.userData = { full_name };
});

// Raycaster for detecting clicks
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onMouseClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects([...planetMeshes.map(({ mesh }) => mesh), ...PHAMeshes.map(({ mesh }) => mesh)]);

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        const objectData = clickedObject.userData;
        alert(`You clicked on ${objectData.full_name}`);

        // Change color temporarily
        const originalColor = clickedObject.material.color.getHex();
        clickedObject.material.color.set(0xff0000);
        setTimeout(() => {
            clickedObject.material.color.set(originalColor);
        }, 300);
    }
}

window.addEventListener('click', onMouseClick, false);

animate();
