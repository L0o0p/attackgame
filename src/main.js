import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// 在文件开头声明当前播放的动画
let currentAction = null;
// 初始化场景、相机和渲染器
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 加载复杂模型
const loader = new GLTFLoader();
const loadedData1 = await loader.loadAsync('/models/gamelike.glb');
const loadedData2 = await loader.loadAsync('/models/gamelike.glb');

// 创建玩家（方块）
const player = loadedData1.scene
scene.add(player);

// 创建目标（多面体）
// const targetGeometry = new THREE.IcosahedronGeometry(1);
// const targetMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
// const target = new THREE.Mesh(targetGeometry, targetMaterial);
// 加载模型
const target = loadedData2.scene
target.position.x = 5;
scene.add(target);
// 加载动画
const targetAnimations = loadedData2.animations;
// 关键部分：给模型mesh装动画AnimationClip
const mixer = new THREE.AnimationMixer(target);
let actions = new Map();
targetAnimations.forEach(clip => {
  // 移除 "_Armature" 后缀，使动画名称更简洁
  const name = clip.name.replace('_Armature', '');
  const action = mixer.clipAction(clip);
  // console.log('action', clip);
  actions.set(name, action);
  // console.log(`Loaded animation: ${name}`);
});
// 播放动画
const newAction = actions.get('idle');
newAction.play();

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

// 动画切换函数
function switchAnimation(newActionName) {
  const newAction = actions.get(newActionName);
  if (!newAction) return;

  if (currentAction) {
    // 使用crossFade实现平滑过渡
    currentAction.fadeOut(0.2);
  }

  newAction.reset();
  newAction.fadeIn(0.2);
  newAction.play();
  currentAction = newAction;
}

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

      // 其他效果（动画变更、改变颜色等）
      // 播放受击动画
      const hitAction = actions.get('hit');
      if (hitAction) {
        hitAction.setLoop(THREE.LoopOnce); // 只播放一次
        hitAction.clampWhenFinished = true; // 播放结束后保持在最后一帧
        switchAnimation('hit');
      }
    }
    playerState.isAttacking = false;
  }
}

// 更新目标状态
function updateTarget() {
  if (targetState.isHit) {

    // target.rotation.x += 0.1;
    // target.rotation.y += 0.1;
    // 角色变色
    console.log('hit');

    if (targetState.hitCooldown > 0) {
      targetState.hitCooldown--;
    } else {
      targetState.isHit = false;
      // 受击结束，切换回idle动画
      const idleAction = actions.get('idle');
      if (idleAction) {
        idleAction.setLoop(THREE.LoopRepeat); // 循环播放
        switchAnimation('idle');
      }
    }
  }
}

// 动画循环
function animate() {
  requestAnimationFrame(animate);
  // 获取时间增量
  const delta = clock.getDelta();

  // 更新动画混合器
  if (mixer) {
    mixer.update(delta);
  }
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

// 0. 场景初始化
// 1. 加载模型
// 2. 移动：定义更新方法：定义了一些模型参数，运算出模型的最新位置
//     position最新位置player.position.add(playerState.velocity); 
//     velocity更新速度if (keys['w']) playerState.velocity.z -= playerState.speed;   
// 3. 攻击：定义攻击检测方法 
//     是否处于攻击状态isAttacking
//     计算距离判断攻击是否生效distance = player.position.distanceTo(target.position);
//     击中效果：
//         目标进入「击退」状态：targetState.isHit = true;
//         目标位置改变
//         其他击退效果（变色、动画等）
//         最后退出击退效果
// 4. 动画循环