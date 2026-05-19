/**
 * ViewManager.ts
 * UI视图管理器（参考货柜归位大闯关的结构）
 */

import { instantiate, Prefab, Node, director, isValid, Component } from 'cc';
import { SingletonClass } from './SingletonClass';
import { BaseView, WindowOpenType } from '../components/BaseView';
import { ResLoadHelper } from './ResLoadHelper';

interface WaitData {
    name: string;
    data: any[];
}

export class ViewManager extends SingletonClass<ViewManager> {

    /** 所有已打开的视图 */
    private allViews: Map<string, BaseView> = new Map();

    /** 待打开队列 */
    private waitList: WaitData[] = [];

    /** 是否正在打开 */
    private isOpening: boolean = false;

    private sceneNode: Node | null = null;

    protected onInit(): void {
        // nothing
    }

    /**
     * 初始化（App调用）
     */
    public init(rootNode: Node): void {
        this.sceneNode = rootNode;
    }

    /**
     * 打开视图
     * @param viewName prefab路径（与ViewName中定义一致）
     * @param args 传递给视图的数据
     */
    public async openView(viewName: string, ...args: any): Promise<Node | null> {
        // 防止重复打开Single视图
        if (this.isOpening) {
            this.waitList.push({ name: viewName, data: args });
            return null;
        }

        // 如果Single视图已存在，不再打开
        if (this.allViews.has(viewName)) {
            console.log(`[ViewManager] view already open: ${viewName}`);
            return null;
        }

        this.isOpening = true;

        // 加载预制体
        const prefab = await ResLoadHelper.loadPrefabSync(viewName);
        if (!prefab) {
            console.error(`[ViewManager] prefab not found: ${viewName}`);
            this.isOpening = false;
            this.openNext();
            return null;
        }

        // 实例化
        const viewNode = instantiate(prefab);
        const root = this.getRoot();
        root.addChild(viewNode);
        viewNode.setPosition(0, 0, 0);

        // 获取BaseView组件（预制体上应已挂好对应脚本，继承自BaseView）
        let viewCmpt = viewNode.getComponent(BaseView);
        if (!viewCmpt) {
            console.error(`[ViewManager] BaseView not found: ${viewName}`);
            viewNode.destroy();
            this.isOpening = false;
            this.openNext();
            return null;
        }

        // 存入管理
        viewNode["viewName"] = viewName;
        this.allViews.set(viewName, viewCmpt);

        // 加载数据
        if (args.length > 0) {
            viewCmpt.loadExtraData(...args);
        }

        console.log(`[ViewManager] open: ${viewName}`);
        this.isOpening = false;
        this.openNext();

        return viewNode;
    }

    /**
     * 关闭视图
     */
    public closeView(viewName: string): void {
        const viewCmpt = this.allViews.get(viewName);
        if (!viewCmpt) {
            console.log(`[ViewManager] close view not found: ${viewName}`);
            return;
        }

        console.log(`[ViewManager] close: ${viewName}`);
        this.allViews.delete(viewName);
        viewCmpt.onClose();
    }

    /**
     * 关闭当前最上层视图
     */
    public closeTopView(): void {
        let lastKey: string | null = null;
        let lastIndex = -1;

        for (const [key, view] of this.allViews) {
            const idx = view.node.getSiblingIndex();
            if (idx >= lastIndex) {
                lastIndex = idx;
                lastKey = key;
            }
        }

        if (lastKey) {
            this.closeView(lastKey);
        }
    }

    /**
     * 关闭所有视图
     */
    public closeAllViews(): void {
        for (const [key] of this.allViews) {
            this.closeView(key);
        }
        this.allViews.clear();
    }

    /**
     * 获取视图是否存在
     */
    public isViewOpen(viewName: string): boolean {
        const v = this.allViews.get(viewName);
        return v != null && isValid(v.node);
    }

    /**
     * 获取视图实例
     */
    public getView<T extends BaseView>(viewName: string): T | null {
        return this.allViews.get(viewName) as T ?? null;
    }

    /**
     * 获取所有已打开的视图名
     */
    public getOpenViews(): IterableIterator<string> {
        return this.allViews.keys();
    }

    /**
     * 打开待打开队列中的下一个
     */
    private openNext(): void {
        if (this.waitList.length === 0) return;
        const next = this.waitList.shift()!;
        this.openView(next.name, ...next.data);
    }

    /**
     * 获取根节点
     */
    private getRoot(): Node {
        if (this.sceneNode) return this.sceneNode;
        const canvas = director.getScene().getChildByName('Canvas');
        return canvas || director.getScene();
    }
}
