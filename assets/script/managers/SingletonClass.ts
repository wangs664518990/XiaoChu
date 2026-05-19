/**
 * SingletonClass.ts
 * 单例基类
 */

export class SingletonClass<T extends SingletonClass<T>> {
    private static _instance: any = null;

    public static getInstance<T extends SingletonClass<T>>(cls: new () => T): T {
        if (!cls._instance) {
            cls._instance = new cls();
            (cls._instance as any).onInit();
        }
        return cls._instance as T;
    }

    protected onInit(): void {
        // 子类重写
    }
}
