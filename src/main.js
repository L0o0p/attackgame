import * as THREE from 'three';

// 初始化场景、相机和渲染器
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 创建玩家（方块）
const playerGeometry = new THREE.BoxGeometry(1, 1, 1);
const playerMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
scene.add(player);

// 创建目标（多面体）
const targetGeometry = new THREE.IcosahedronGeometry(1);
const targetMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
const target = new THREE.Mesh(targetGeometry, targetMaterial);
target.position.x = 5;
scene.add(target);

// 添加光源
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(0, 10, 10);
scene.add(light);
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// 设置相机位置
camera.position.z = 15;

// 游戏状态
const playerState = {
  velocity: new THREE.Vector3(),
  speed: 0.1,
  isAttacking: false
};

const targetState = {
  isHit: false,
  hitCooldown: 0,
  originalColor: 0xff0000,
  hitColor: 0xff00ff
};

// 键盘控制
const keys = {};
document.addEventListener('keydown', (event) => {
  keys[event.key.toLowerCase()] = true;
  if (event.code === 'Space') {
    playerState.isAttacking = true;
  }
});
document.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

// 更新玩家位置
function updatePlayer() {
  if (keys['w']) playerState.velocity.z -= playerState.speed;
  if (keys['s']) playerState.velocity.z += playerState.speed;
  if (keys['a']) playerState.velocity.x -= playerState.speed;
  if (keys['d']) playerState.velocity.x += playerState.speed;

  player.position.add(playerState.velocity);
  playerState.velocity.multiplyScalar(0.9); // 添加摩擦力
}

// 检测攻击
function checkAttack() {
  if (playerState.isAttacking) {
    const distance = player.position.distanceTo(target.position);
    if (distance < 3 && !targetState.isHit) {
      // 击中效果
      targetState.isHit = true;
      targetState.hitCooldown = 30;

      // 击退效果
      const knockbackDirection = target.position.clone()
        .sub(player.position).normalize().multiplyScalar(0.5);
      target.position.add(knockbackDirection);

      // 改变颜色
      target.material.color.setHex(targetState.hitColor);
    }
    playerState.isAttacking = false;
  }
}

// 更新目标状态
function updateTarget() {
  if (targetState.isHit) {
    target.rotation.x += 0.1;
    target.rotation.y += 0.1;

    if (targetState.hitCooldown > 0) {
      targetState.hitCooldown--;
    } else {
      targetState.isHit = false;
      target.material.color.setHex(targetState.originalColor);
    }
  }
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);

  updatePlayer();
  checkAttack();
  updateTarget();

  renderer.render(scene, camera);
}

// 窗口大小调整
window.addEventListener('resize', onWindowResize, false);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

animate();