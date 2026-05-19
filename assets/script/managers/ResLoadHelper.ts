/**
 * ResLoadHelper.ts
 * 资源加载助手（参考货柜归位大闯关）
 */

import { Prefab, SpriteFrame, resources, Node } from 'cc';

export class ResLoadHelper {

    /**
     * 同步加载预制体
     */
    public static loadPrefabSync(path: string): Promise<Prefab | null> {
        return new Promise((resolve) => {
            resources.load(path, Prefab, (err, asset) => {
                if (err || !asset) {
                    resolve(null);
                } else {
                    resolve(asset as Prefab);
                }
            });
        });
    }

    /**
     * 同步加载 SpriteFrame
     */
    public static loadSpriteFrameSync(path: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            resources.load(path, SpriteFrame, (err, asset) => {
                if (err || !asset) {
                    resolve(null);
                } else {
                    resolve(asset as SpriteFrame);
                }
            });
        });
    }

    /**
     * 批量加载 SpriteFrame
     */
    public static loadSpriteFrames(paths: string[]): Promise<Map<string, SpriteFrame>> {
        const results = new Map<string, SpriteFrame>();
        const promises = paths.map((path) =>
            this.loadSpriteFrameSync(path).then((sf) => {
                if (sf) results.set(path, sf);
            })
        );
        return Promise.all(promises).then(() => results);
    }

    /**
     * 预加载多个预制体
     */
    public static preloadPrefabs(paths: string[]): Promise<void> {
        const promises = paths.map((path) => this.loadPrefabSync(path).then(() => { }));
        return Promise.all(promises).then(() => { });
    }
}
