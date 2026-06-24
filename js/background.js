(function () {
  const canvas = document.getElementById('bg-canvas');
  const fallback = document.getElementById('bg-fallback');

  if (!canvas || typeof THREE === 'undefined') {
    if (canvas) {
      canvas.style.display = 'none';
    }
    if (fallback) {
      fallback.style.display = 'block';
    }
    return;
  }

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
  const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const loader = new THREE.CubeTextureLoader();
  const cubeTexture = loader
    .setPath('assets/imagenes-minecraft/')
    .load([
      'panorama_1.png', 'panorama_3.png',
      'panorama_4.png', 'panorama_5.png',
      'panorama_0.png', 'panorama_2.png'
    ]);
  scene.background = cubeTexture;

  camera.position.set(0, 0, 0);

  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const t = (Date.now() - startTime) * 0.00003;

    // Movimiento hacia la derecha estilo Minecraft - rotación positiva en Y
    const targetRotY = t * 0.9;
    const targetRotX = Math.sin(t * 1.15) * 0.02;

    // Lerp más rápido para movimiento más perceptible
    camera.rotation.y += (targetRotY - camera.rotation.y) * 0.008;
    camera.rotation.x += (targetRotX - camera.rotation.x) * 0.008;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
