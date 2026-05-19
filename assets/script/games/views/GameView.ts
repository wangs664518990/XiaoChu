/**
 * GameView.ts
 * 游戏主界面视图
 */

import { _decorator, Component, Node, Label, Color, Sprite, EventTouch, Vec3, tween } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { EventName } from '../../const/EventName';
import { GameManager } from '../GameManager';

const { ccclass, property } = _decorator;

@ccclass('GameView')
export class GameView extends BaseView {

    private scoreLabel: Label | null = null;
    private gameNode: Node | null = null;

    protected onLoad(): void {
        super.onLoad();

        // 找到游戏节点
        this.gameNode = this.getNode('GameNode');

        // 设置GameManager根节点
        if (this.gameNode) {
            App.game.setGameRoot(this.gameNode);
        }

        // 绑定触摸
        this.bindTouchInput();
    }

    protected addEvents(): void {
        App.event.on(EventName.SCORE_UPDATE, this.onScoreUpdate, this);
        App.event.on(EventName.GAME_OVER, this.onGameOver, this);
        App.event.on(EventName.BLOCK_ELIMINATED, this.onBlockEliminated, this);
    }

    public loadExtraData(...args: any): void {
        super.loadExtraData(...args);
        // 启动游戏
        App.game.startGame();
    }

    /**
     * 绑定触摸输入
     * 触摸区域命名：TouchZone
     */
    private bindTouchInput(): void {
        const touchZone = this.getNode('TouchZone');
        if (!touchZone) return;

        touchZone.on(Node.EventType.TOUCH_END, (event: EventTouch) => {
            const loc = event.getLocation();
            const uiLoc = event.getUILocation();
            // 转换到世界坐标
            const worldPos = new Vec3(uiLoc.x, uiLoc.y, 0);
            App.game.dropBlock(worldPos.x);
        }, this);
    }

    private onScoreUpdate(score: number): void {
        const label = this.getNode('Label_Score');
        if (label) {
            label.getComponent(Label).string = `${score}`;
        }
    }

    private onGameOver(score: number, highScore: number): void {
        // 显示结算
        App.showResult(score);

        // 播放失败动画
        const board = this.getNode('Board');
        if (board) {
            tween(board)
                .to(0.3, { opacity: 128 })
                .start();
        }
    }

    private onBlockEliminated(x: number, y: number): void {
        // 可以播放粒子效果等
        // 目前保持简洁
    }

    /**
     * 暂停按钮
     */
    protected onClick_BtnPause(): void {
        App.game.pauseGame();
        App.view.openView('prefab/view/pauseView');
    }

    public onDestroy(): void {
        super.onDestroy();
        App.event.offAll(this);
    }
}
