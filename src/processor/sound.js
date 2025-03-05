import * as THREE from 'three';
export class Sound {
    constructor(camera) {
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);
        this.audioLoader = new THREE.AudioLoader();
        this.sounds = new Map();
    }

    // 加载音频
    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            // 创建音频对象
            const sound = new THREE.Audio(this.listener);

            // 加载并设置音频缓冲区
            this.audioLoader.load(
                url,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setVolume(1.0);
                    this.sounds.set(name, sound);
                    resolve(sound);
                },
                // 加载进度回调
                (progress) => {
                    console.log((progress.loaded / progress.total * 100) + '%');
                },
                // 错误回调
                (error) => {
                    console.error('加载音频失败:', error);
                    reject(error);
                }
            );
        });
    }

    // 播放音频
    playSound(name) {
        const sound = this.sounds.get(name);
        if (sound && sound.buffer) {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        }
    }
}
