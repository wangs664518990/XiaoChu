/**
 * StorageHelper.ts
 * 本地存储工具
 */

import { sys } from 'cc';

export class StorageHelper {

    private static prefix = 'xc_';  // 防止和其他应用冲突

    /**
     * 保存数据
     */
    public static setString(key: string, value: string): void {
        try {
            sys.localStorage.setItem(this.prefix + key, value);
        } catch (e) {
            console.warn('[Storage] setString failed:', key);
        }
    }

    /**
     * 读取数据
     */
    public static getString(key: string, defaultVal: string = ''): string {
        try {
            return sys.localStorage.getItem(this.prefix + key) ?? defaultVal;
        } catch (e) {
            return defaultVal;
        }
    }

    /**
     * 保存数字
     */
    public static setNumber(key: string, value: number): void {
        this.setString(key, String(value));
    }

    /**
     * 读取数字
     */
    public static getNumber(key: string, defaultVal: number = 0): number {
        const str = this.getString(key);
        return str ? Number(str) : defaultVal;
    }

    /**
     * 保存布尔
     */
    public static setBoolean(key: string, value: boolean): void {
        this.setString(key, value ? '1' : '0');
    }

    /**
     * 读取布尔
     */
    public static getBoolean(key: string, defaultVal: boolean = false): boolean {
        const str = this.getString(key);
        return str ? str === '1' : defaultVal;
    }

    /**
     * 保存JSON对象
     */
    public static setObject(key: string, obj: object): void {
        try {
            this.setString(key, JSON.stringify(obj));
        } catch (e) {
            console.warn('[Storage] setObject failed:', key);
        }
    }

    /**
     * 读取JSON对象
     */
    public static getObject<T = any>(key: string, defaultVal: T | null = null): T | null {
        const str = this.getString(key);
        if (!str) return defaultVal;
        try {
            return JSON.parse(str) as T;
        } catch (e) {
            return defaultVal;
        }
    }

    /**
     * 删除
     */
    public static remove(key: string): void {
        try {
            sys.localStorage.removeItem(this.prefix + key);
        } catch (e) { }
    }

    /**
     * 清空所有
     */
    public static clear(): void {
        try {
            const keys = Object.keys(sys.localStorage);
            for (const k of keys) {
                if (k.startsWith(this.prefix)) {
                    sys.localStorage.removeItem(k);
                }
            }
        } catch (e) { }
    }
}
