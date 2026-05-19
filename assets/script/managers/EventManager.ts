/**
 * EventManager.ts
 * 全局事件系统（参考货柜归位大闯关的结构）
 */

import { Component, Node } from 'cc';
import { SingletonClass } from './SingletonClass';

interface Listener {
    handler: (...args: any) => void;
    target: Object;
}

export class EventManager extends SingletonClass<EventManager> {
    private _listeners: Map<string, Listener[]> = new Map();

    protected onInit(): void {
        // nothing
    }

    /**
     * 监听事件
     * @param eventName 事件名
     * @param handler 回调
     * @param target 作用域
     */
    public on(eventName: string, handler: (...args: any) => void, target: Object): void {
        if (!handler || !target) return;

        const listener: Listener = { handler, target };
        const list = this._listeners.get(eventName) || [];

        // 自动清理已销毁的监听者
        const filtered = list.filter((it) => {
            if (it.target instanceof Component) {
                return it.target.node && it.target.node.parent;
            }
            if (it.target instanceof Node) {
                return (it.target as Node).parent;
            }
            return true;
        });

        filtered.push(listener);
        this._listeners.set(eventName, filtered);
    }

    /**
     * 触发事件
     * @param eventName 事件名
     * @param args 参数
     */
    public emit(eventName: string, ...args: any): void {
        const list: Listener[] = this._listeners.get(eventName) || [];
        if (list.length === 0) return;

        // 同样做清理
        const filtered = list.filter((it) => {
            if (it.target instanceof Component) {
                return it.target.node && it.target.node.parent;
            }
            if (it.target instanceof Node) {
                return (it.target as Node).parent;
            }
            return true;
        });
        this._listeners.set(eventName, filtered);

        // 执行回调
        for (const it of filtered) {
            it.handler.apply(it.target, args);
        }
    }

    /**
     * 取消某个对象的全部监听
     * @param target 作用域
     */
    public offAll(target: Object): void {
        if (!target) return;
        for (const [key, list] of this._listeners) {
            this._listeners.set(key, list.filter((it) => it.target !== target));
        }
    }

    /**
     * 取消特定事件
     * @param eventName 事件名
     * @param target 作用域
     */
    public off(eventName: string, target: Object): void {
        const list: Listener[] = this._listeners.get(eventName) || [];
        this._listeners.set(eventName, list.filter((it) => it.target !== target));
    }

    /**
     * 清理全部
     */
    public clear(): void {
        this._listeners.clear();
    }
}
