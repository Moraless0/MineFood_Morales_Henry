(function () {
  const canvas = document.getElementById('bg-canvas');
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

  let mouseX = 0;
  let mouseY = 0;
  document.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 2;
    mouseY = (e.clientY / window.innerHeight - 0.5) * 2;
  });

  const startTime = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    const t = (Date.now() - startTime) * 0.00005;

    const targetRotY = t * 0.2;
    const targetRotX = Math.sin(t * 0.5) * 0.04;

    camera.rotation.y += (targetRotY + mouseX * 0.05 - camera.rotation.y) * 0.02;
    camera.rotation.x += (targetRotX + mouseY * 0.03 - camera.rotation.x) * 0.02;

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
})();
