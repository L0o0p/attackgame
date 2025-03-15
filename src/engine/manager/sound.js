import * as THREE from 'three';
export class Sound {
    constructor(camera, loadingManager = null) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader(loadingManager); // 这个不会用到，但保持兼容
        this.sounds = new Map();
        this.tracks = new Map()

    }

    // 加载音频
    async loadSound(key) {
        const srcs = getSrc(key)
        const track = []
        
        if (this.loadingManager) {
            srcs.forEach(() => {
                this.loadingManager.itemStart(key);
            });
        }
        try {
            // 加载所有音频文件
            const loadPromises = srcs.map(src =>
                new Promise((resolve, reject) => {
                    const audio = new Audio();

                    audio.addEventListener('canplaythrough', () => {
                        track.push(audio);
                        // 通知 loadingManager 一个项目加载完成
                        if (this.loadingManager) {
                            this.loadingManager.itemEnd(src);
                        }
                        resolve(audio);
                    }, { once: true });

                    audio.addEventListener('error', (error) => {
                        if (this.loadingManager) {
                            this.loadingManager.itemError(src);
                        }
                        reject(error);
                    }, { once: true });

                    audio.src = src;
                    audio.load(); // 开始加载
                })
            );

            await Promise.all(loadPromises);
            this.tracks.set(key, track);
            console.log(this.tracks);
            

        } catch (error) {
            console.error(`Error loading sound ${key}:`, error);
            // 确保发生错误时也通知 loadingManager
            if (this.loadingManager) {
                srcs.forEach(src => {
                    this.loadingManager.itemError(src);
                });
            }
            throw error;
        }
    }

    // 播放音频
    playSound(key) {
        const track = this.tracks.get(key)        
        
        const index = randomInt(track.length)
        track[index].currentTime = 0
        track[index].play()
    }
}
const reg = /\[(.*?)\]/
// 真个函数的功能是将字符串中的[]替换为对应的值
export function getSrc(src) {
    const match = src.match(reg)
    if (match !== null) {
        const range = match[1].split('-')
        const iBegin = parseInt(range[0], 10)
        const iEnd = parseInt(range[1], 10)
        const size = iEnd - iBegin + 1
        const source = src.split('[')[0]
        const ext = src.split(']')[1]
        return new Array(size).fill(null).map((e, i) => source + (i + iBegin) + ext)
    }
    return [src]
}

export function randomInt(range = 1) {
    return Math.floor(Math.random() * range)
}