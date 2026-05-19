/**
 * AudioManager.ts
 * 音频管理器
 */

import { Node, AudioSource, AudioClip, resources } from 'cc';
import { SingletonClass } from './SingletonClass';
import { STORAGE_KEY } from '../const/GameConfig';

export class AudioManager extends SingletonClass<AudioManager> {

    private bgmSource: AudioSource | null = null;
    private sfxSource: AudioSource | null = null;

    private currentBgm: string = '';
    private sfxVolume: number = 1.0;
    private bgmVolume: number = 1.0;

    protected onInit(): void {
        // nothing, 由 App 初始化时传入根节点
    }

    /**
     * 初始化（App调用）
     */
    public init(rootNode: Node): void {
        const bgmNode = new Node('AudioBGM');
        bgmNode.parent = rootNode;
        this.bgmSource = bgmNode.addComponent(AudioSource);
        this.bgmSource.volume = this.bgmVolume;

        const sfxNode = new Node('AudioSFX');
        sfxNode.parent = rootNode;
        this.sfxSource = sfxNode.addComponent(AudioSource);
        this.sfxSource.volume = this.sfxVolume;
    }

    /**
     * 播放背景音乐
     */
    public playBGM(path: string, loop: boolean = true): void {
        if (!this.bgmSource) return;
        if (this.currentBgm === path) return;

        resources.load(path, AudioClip, (err, clip) => {
            if (err || !clip) return;
            this.currentBgm = path;
            this.bgmSource!.clip = clip as AudioClip;
            this.bgmSource!.loop = loop;
            this.bgmSource!.play();
        });
    }

    /**
     * 停止BGM
     */
    public stopBGM(): void {
        if (this.bgmSource) {
            this.bgmSource.stop();
        }
    }

    /**
     * 播放音效
     */
    public playSFX(path: string): void {
        if (!this.sfxSource) return;

        resources.load(path, AudioClip, (err, clip) => {
            if (err || !clip) return;
            this.sfxSource!.playOneShot(clip as AudioClip, this.sfxVolume);
        });
    }

    /**
     * 设置BGM音量
     */
    public setBGMVolume(vol: number): void {
        this.bgmVolume = Math.max(0, Math.min(1, vol));
        if (this.bgmSource) this.bgmSource.volume = this.bgmVolume;
    }

    /**
     * 设置音效音量
     */
    public setSFXVolume(vol: number): void {
        this.sfxVolume = Math.max(0, Math.min(1, vol));
        if (this.sfxSource) this.sfxSource.volume = this.sfxVolume;
    }

    /**
     * 静音BGM
     */
    public muteBGM(mute: boolean): void {
        if (this.bgmSource) this.bgmSource.mute = mute;
    }

    /**
     * 静音SFX
     */
    public muteSFX(mute: boolean): void {
        if (this.sfxSource) this.sfxSource.mute = mute;
    }
}
