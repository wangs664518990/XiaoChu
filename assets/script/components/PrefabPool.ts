/**
 * PrefabPool.ts
 * 对象池 - 复用预制体实例
 */

import { Node, Prefab, instantiate, resources } from 'cc';

export class PrefabPool {

    private pool: Node[] = [];
    private prefabPath: string = '';
    private prefab: Prefab | null = null;

    /**
     * 初始化对象池
     */
    public initPool(prefabPath: string, preLoadCount: number = 5): void {
        this.prefabPath = prefabPath;
        resources.load(prefabPath, Prefab, (err, pre) => {
            if (err || !pre) return;
            this.prefab = pre as Prefab;
            // 预加载
            for (let i = 0; i < preLoadCount; i++) {
                const node = instantiate(this.prefab);
                node.active = false;
                this.pool.push(node);
            }
        });
    }

    /**
     * 获取节点（从池中取或新建）
     */
    public getNode(): Promise<Node> {
        return new Promise((resolve) => {
            if (this.pool.length > 0) {
                const node = this.pool.pop()!;
                node.active = true;
                resolve(node);
                return;
            }

            // 池为空，直接克隆
            if (this.prefab) {
                const node = instantiate(this.prefab);
                node.active = true;
                resolve(node);
            } else {
                // prefab 还没加载完，等待
                const check = () => {
                    if (this.prefab) {
                        const node = instantiate(this.prefab);
                        node.active = true;
                        resolve(node);
                    } else {
                        setTimeout(check, 50);
                    }
                };
                check();
            }
        });
    }

    /**
     * 归还节点到池
     */
    public putNode(node: Node): void {
        if (!node) return;
        node.active = false;
        node.removeFromParent();
        this.pool.push(node);
    }

    /**
     * 清空池
     */
    public clear(): void {
        for (const n of this.pool) {
            n.destroy();
        }
        this.pool.length = 0;
    }

    public get poolSize(): number {
        return this.pool.length;
    }
}
