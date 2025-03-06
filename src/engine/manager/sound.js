import * as THREE from 'three';
export class Sound {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();
        this.sounds = new Map();
        this.tracks = new Map()

    }

    // 加载音频
    async loadSound(key) {
        const srcs = getSrc(key)
        console.log(srcs);
        const track = []
        for (const src of srcs) {
            const audio = new Audio(src)
            track.push(audio)
        }
        this.tracks.set(key, track)
    }

    // 播放音频
    playSound(key) {
        console.log('key', key);
        const track = this.tracks.get(key)        
        const index = randomInt(track.length)
        track[index].currentTime = 0
        console.log(track[index]);
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