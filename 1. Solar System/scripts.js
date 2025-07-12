// Planet data with realistic orbital speeds
const planetData = {
    mercury: {
        name: "Mercury",
        radius: 0.5,
        distance: 10,
        speed: 0.004,
        color: 0x8C7853,
        description: "Mercury is the smallest planet in our solar system and the closest to the Sun. Its surface is covered with craters and it has extreme temperature variations."
    },
    venus: {
        name: "Venus",
        radius: 0.9,
        distance: 15,
        speed: 0.0015,
        color: 0xFFC649,
        description: "Venus is the hottest planet in our solar system with a thick, toxic atmosphere. It's often called Earth's twin due to similar size."
    },
    earth: {
        name: "Earth",
        radius: 1,
        distance: 20,
        speed: 0.001,
        color: 0x2E7FFF,
        description: "Earth is our home planet, the only known planet to harbor life. It has one natural satellite, the Moon."
    },
    mars: {
        name: "Mars",
        radius: 0.7,
        distance: 25,
        speed: 0.0008,
        color: 0xFF4500,
        description: "Mars is known as the Red Planet due to iron oxide on its surface. It has the largest volcano and canyon in the solar system."
    },
    jupiter: {
        name: "Jupiter",
        radius: 3,
        distance: 35,
        speed: 0.0004,
        color: 0xD2691E,
        description: "Jupiter is the largest planet in our solar system. It has a Great Red Spot, which is a giant storm that has lasted for centuries."
    },
    saturn: {
        name: "Saturn",
        radius: 2.5,
        distance: 45,
        speed: 0.0003,
        color: 0xF4A460,
        description: "Saturn is famous for its spectacular ring system. It's the second-largest planet and is made mostly of hydrogen and helium."
    },
    uranus: {
        name: "Uranus",
        radius: 1.5,
        distance: 55,
        speed: 0.0002,
        color: 0x4FD0E0,
        description: "Uranus rotates on its side, making it unique among the planets. It has a faint ring system and 27 known moons."
    },
    neptune: {
        name: "Neptune",
        radius: 1.4,
        distance: 65,
        speed: 0.0001,
        color: 0x4169E1,
        description: "Neptune is the windiest planet with speeds reaching up to 1,200 mph. It's the most distant major planet from the Sun."
    }
};

// Sun data
const sunData = {
    name: "Sun",
    description: "The Sun is the star at the center of our solar system. It's a nearly perfect sphere of hot plasma that provides light and heat to all planets. Its core temperature reaches 15 million degrees Celsius."
};

// Three.js setup
let scene, camera, renderer;
let planets = {};
let starField;
let raycaster, mouse;
let sun, sunGlow;

// Camera controls
let isMouseDown = false;
let mouseX = 0;
let mouseY = 0;
let targetRotationX = 0;
let targetRotationY = 0;
let rotationX = 0;
let rotationY = 0;
let cameraDistance = 50;
let trackingPlanet = null;
let trackingOffset = { x: 0, y: 15, z: 0 };

// Touch controls for mobile
let touchStartX = 0;
let touchStartY = 0;
let touchStartDistance = 0;

function init() {
    // Scene setup
    scene = new THREE.Scene();
    
    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(30, 30, 50);
    camera.lookAt(0, 0, 0);
    
    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.getElementById('canvas-container').appendChild(renderer.domElement);
    
    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);
    
    const pointLight = new THREE.PointLight(0xffffff, 2);
    pointLight.position.set(0, 0, 0);
    scene.add(pointLight);
    
    // Create Sun
    const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xFFD700,
        emissive: 0xFFD700,
        emissiveIntensity: 1
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.userData = sunData;
    scene.add(sun);
    
    // Add glow to sun
    const glowGeometry = new THREE.SphereGeometry(6, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xFFD700,
        transparent: true,
        opacity: 0.3
    });
    sunGlow = new THREE.Mesh(glowGeometry, glowMaterial);
    scene.add(sunGlow);
    
    // Create planets
    for (const [key, data] of Object.entries(planetData)) {
        createPlanet(key, data);
    }
    
    // Create star field
    createStarField();
    
    // Raycaster for mouse interaction
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Hide loading screen
    document.querySelector('.loading').style.display = 'none';
}

function createPlanet(key, data) {
    const planetGroup = new THREE.Group();
    
    // Planet
    const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: data.color,
        shininess: 100
    });
    const planet = new THREE.Mesh(geometry, material);
    planet.userData = { key, ...data };
    
    // Orbit line
    const orbitGeometry = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(
            Math.cos(angle) * data.distance,
            0,
            Math.sin(angle) * data.distance
        ));
    }
    orbitGeometry.setFromPoints(orbitPoints);
    const orbitMaterial = new THREE.LineBasicMaterial({ 
        color: 0x444444,
        transparent: true,
        opacity: 0.3
    });
    const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
    scene.add(orbitLine);
    
    planetGroup.add(planet);
    scene.add(planetGroup);
    
    planets[key] = {
        group: planetGroup,
        mesh: planet,
        data: data,
        angle: Math.random() * Math.PI * 2
    };
}

function createStarField() {
    const starsGeometry = new THREE.BufferGeometry();
    const starPositions = [];
    
    for (let i = 0; i < 10000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = (Math.random() - 0.5) * 2000;
        const z = (Math.random() - 0.5) * 2000;
        starPositions.push(x, y, z);
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
    
    const starsMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 0.5,
        transparent: true,
        opacity: 0.8
    });
    
    starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);
}

function animate() {
    requestAnimationFrame(animate);
    
    // Rotate planets
    for (const [key, planet] of Object.entries(planets)) {
        planet.angle += planet.data.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.data.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.data.distance;
        planet.mesh.rotation.y += 0.01;
    }
    
    // Camera tracking mode
    if (trackingPlanet) {
        // Follow the planet from bird's eye view
        camera.position.x = trackingPlanet.mesh.position.x + trackingOffset.x;
        camera.position.y = trackingOffset.y;
        camera.position.z = trackingPlanet.mesh.position.z + trackingOffset.z;
        camera.lookAt(trackingPlanet.mesh.position);
    } else {
        // Normal camera rotation
        rotationX += (targetRotationX - rotationX) * 0.05;
        rotationY += (targetRotationY - rotationY) * 0.05;
        
        // Update camera position based on rotation
        camera.position.x = Math.sin(rotationY) * cameraDistance;
        camera.position.y = Math.sin(rotationX) * cameraDistance;
        camera.position.z = Math.cos(rotationY) * cameraDistance;
        camera.lookAt(0, 0, 0);
    }
    
    // Rotate star field slowly
    if (starField) {
        starField.rotation.y += 0.0001;
    }
    
    renderer.render(scene, camera);
}

// Mouse controls
function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseUp(event) {
    isMouseDown = false;
}

function onMouseMove(event) {
    if (isMouseDown) {
        const deltaX = event.clientX - mouseX;
        const deltaY = event.clientY - mouseY;
        
        // Exit tracking mode only when actually dragging
        if (trackingPlanet && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
            trackingPlanet = null;
            document.getElementById('planet-search').value = '';
            document.getElementById('exit-tracking').style.display = 'none';
        }
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        
        // Limit vertical rotation
        targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
        
        mouseX = event.clientX;
        mouseY = event.clientY;
    }
    
    // Update mouse position for raycaster
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onMouseWheel(event) {
    // Zoom with mouse wheel
    const zoomSpeed = 0.1;
    if (event.deltaY < 0) {
        cameraDistance = Math.max(15, cameraDistance * (1 - zoomSpeed));
    } else {
        cameraDistance = Math.min(150, cameraDistance * (1 + zoomSpeed));
    }
}

function onMouseClick(event) {
    // Prevent click when dragging
    if (Math.abs(event.clientX - mouseX) > 5 || Math.abs(event.clientY - mouseY) > 5) {
        return;
    }
    
    // Check if clicking on UI elements
    const isUIClick = event.target.closest('.planet-info') || 
                    event.target.closest('.controls') || 
                    event.target.closest('.exit-tracking') ||
                    event.target.closest('.instructions');
    
    if (isUIClick) {
        return;
    }
    
    raycaster.setFromCamera(mouse, camera);
    
    // Check sun first
    const sunIntersects = raycaster.intersectObject(sun);
    if (sunIntersects.length > 0) {
        showPlanetInfo(sunData);
        return;
    }
    
    // Check planets
    const planetMeshes = Object.values(planets).map(p => p.mesh);
    const intersects = raycaster.intersectObjects(planetMeshes);
    
    if (intersects.length > 0) {
        const clickedPlanet = intersects[0].object.userData;
        showPlanetInfo(clickedPlanet);
    } else {
        // Click on empty space closes planet info
        closePlanetInfo();
    }
}

function showPlanetInfo(planetData) {
    document.getElementById('planet-name').textContent = planetData.name;
    document.getElementById('planet-description').textContent = planetData.description;
    document.getElementById('planet-info').style.display = 'block';
    
    // Add cursor hint
    document.getElementById('canvas-container').style.cursor = 'pointer';
}

function closePlanetInfo() {
    document.getElementById('planet-info').style.display = 'none';
    
    // Reset cursor
    document.getElementById('canvas-container').style.cursor = 'default';
}

// Touch controls for mobile
let touchDragged = false;

function onTouchStart(event) {
    touchDragged = false;
    
    if (event.touches.length === 1) {
        // Single touch - rotation
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Two touches - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        touchStartDistance = Math.sqrt(dx * dx + dy * dy);
    }
}

function onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1) {
        // Single touch - rotation
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        
        // Mark as dragged if moved significantly
        if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
            touchDragged = true;
            
            // Exit tracking mode when dragging
            if (trackingPlanet) {
                trackingPlanet = null;
                document.getElementById('planet-search').value = '';
                document.getElementById('exit-tracking').style.display = 'none';
            }
        }
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        targetRotationX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, targetRotationX));
        
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Two touches - zoom
        const dx = event.touches[0].clientX - event.touches[1].clientX;
        const dy = event.touches[0].clientY - event.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        const scale = distance / touchStartDistance;
        cameraDistance = Math.max(15, Math.min(150, cameraDistance / scale));
        
        touchStartDistance = distance;
        touchDragged = true;
    }
}

function onTouchEnd(event) {
    // Update mouse position for raycaster on tap
    if (event.changedTouches.length === 1 && !touchDragged) {
        const touch = event.changedTouches[0];
        
        // Check if touching UI elements
        const element = document.elementFromPoint(touch.clientX, touch.clientY);
        const isUITouch = element && (
            element.closest('.planet-info') || 
            element.closest('.controls') || 
            element.closest('.exit-tracking') ||
            element.closest('.instructions')
        );
        
        if (isUITouch) {
            return;
        }
        
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
        
        // Simulate click for planet selection
        setTimeout(() => {
            raycaster.setFromCamera(mouse, camera);
            
            // Check sun first
            const sunIntersects = raycaster.intersectObject(sun);
            if (sunIntersects.length > 0) {
                showPlanetInfo(sunData);
                return;
            }
            
            // Check planets
            const planetMeshes = Object.values(planets).map(p => p.mesh);
            const intersects = raycaster.intersectObjects(planetMeshes);
            
            if (intersects.length > 0) {
                const clickedPlanet = intersects[0].object.userData;
                showPlanetInfo(clickedPlanet);
            } else {
                // Tap on empty space closes planet info
                closePlanetInfo();
            }
        }, 100);
    }
}

// Search functionality
document.getElementById('planet-search').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    
    if (searchTerm.length <= 2) {
        // Stop tracking if search is cleared
        trackingPlanet = null;
        document.getElementById('exit-tracking').style.display = 'none';
        return;
    }
    
    // Check sun
    if ('sun'.includes(searchTerm)) {
        trackingPlanet = null; // Stop tracking planets
        document.getElementById('exit-tracking').style.display = 'none';
        targetRotationX = 0.3;
        targetRotationY = 0;
        cameraDistance = 30;
        return;
    }
    
    // Check planets
    for (const [key, planet] of Object.entries(planets)) {
        if (key.includes(searchTerm) || planet.data.name.toLowerCase().includes(searchTerm)) {
            // Enable tracking mode for the planet
            trackingPlanet = planet;
            // Bird's eye view - camera positioned above the planet
            trackingOffset = { 
                x: 0, 
                y: planet.data.radius * 15 + 20, // Higher for better bird's eye view
                z: planet.data.radius * 2 // Slight offset for better angle
            };
            document.getElementById('exit-tracking').style.display = 'block';
            break;
        }
    }
});

function exitTracking() {
    trackingPlanet = null;
    document.getElementById('exit-tracking').style.display = 'none';
    document.getElementById('planet-search').value = '';
}

// Zoom controls (optional - can still use buttons)
document.getElementById('zoom-in').addEventListener('click', function() {
    cameraDistance = Math.max(15, cameraDistance * 0.9);
});

document.getElementById('zoom-out').addEventListener('click', function() {
    cameraDistance = Math.min(150, cameraDistance * 1.1);
});

// Keyboard controls
function onKeyDown(event) {
    if (event.key === 'Escape') {
        closePlanetInfo();
    }
}

// Window resize
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Mouse events
window.addEventListener('mousedown', onMouseDown);
window.addEventListener('mouseup', onMouseUp);
window.addEventListener('mousemove', onMouseMove);
window.addEventListener('click', onMouseClick);
window.addEventListener('wheel', onMouseWheel);

// Keyboard events
window.addEventListener('keydown', onKeyDown);

// Touch events for mobile
window.addEventListener('touchstart', onTouchStart, { passive: false });
window.addEventListener('touchmove', onTouchMove, { passive: false });
window.addEventListener('touchend', onTouchEnd);

// Detect mobile and show appropriate instructions
function detectMobile() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    
    const desktopControls = document.querySelector('.desktop-controls');
    const mobileControls = document.querySelector('.mobile-controls');
    
    if (desktopControls && mobileControls) {
        if (isMobile) {
            desktopControls.style.display = 'none';
            mobileControls.style.display = 'block';
        } else {
            desktopControls.style.display = 'block';
            mobileControls.style.display = 'none';
        }
    }
}

detectMobile();
window.addEventListener('resize', detectMobile);

// Global functions for HTML onclick
window.exitTracking = exitTracking;

// Initialize
init();
animate();