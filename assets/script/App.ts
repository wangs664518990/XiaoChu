/**
 * App.ts
 * 全局App单例 - 所有管理器的统一入口（参考货柜归位大闯关）
 */

import { Node } from 'cc';
import { SingletonClass } from './managers/SingletonClass';
import { EventManager } from './managers/EventManager';
import { ViewManager } from './managers/ViewManager';
import { AudioManager } from './managers/AudioManager';
import { GameManager } from './games/GameManager';
import { StorageHelper } from './utils/StorageHelper';
import { STORAGE_KEY } from './const/GameConfig';
import { EventName } from './const/EventName';
import { ViewName } from './const/ViewName';

class GameApp extends SingletonClass<GameApp> {

    // ===== 管理器访问器 =====
    get view(): ViewManager { return ViewManager.getInstance(ViewManager); }
    get event(): EventManager { return EventManager.getInstance(EventManager); }
    get audio(): AudioManager { return AudioManager.getInstance(AudioManager); }
    get game(): GameManager { return GameManager.getInstance(GameManager); }

    /**
     * 初始化（main.ts调用）
     */
    public init(canvas: Node): void {
        // 初始化各管理器
        this.view.init(canvas);
        this.audio.init(canvas);
        this.game.init();

        // 读取存档
        StorageHelper.getString(STORAGE_KEY.HIGH_SCORE);
    }

    /**
     * 返回主页
     */
    public backHome(): void {
        this.view.closeAllViews();
        this.view.openView(ViewName.homeView);
    }

    /**
     * 开始游戏
     */
    public startGame(): void {
        this.view.closeView(ViewName.homeView);
        this.view.openView(ViewName.gameView);
    }

    /**
     * 显示结算
     */
    public showResult(score: number): void {
        this.view.openView(ViewName.resultView, score);
    }

    /**
     * 显示设置
     */
    public showSettings(): void {
        this.view.openView(ViewName.settingsView);
    }

    /**
     * 切换静音
     */
    public toggleMusic(): void {
        const isOn = StorageHelper.getBoolean(STORAGE_KEY.MUSIC_ON, true);
        StorageHelper.setBoolean(STORAGE_KEY.MUSIC_ON, !isOn);
        this.audio.muteBGM(!isOn);
    }

    public toggleSFX(): void {
        const isOn = StorageHelper.getBoolean(STORAGE_KEY.SFX_ON, true);
        StorageHelper.setBoolean(STORAGE_KEY.SFX_ON, !isOn);
        this.audio.muteSFX(!isOn);
    }
}

export const App: GameApp = GameApp.getInstance(GameApp);

// 暴露到全局，方便原生调用
(window as any)['JsApp'] = App;
