/**
 * HomeView.ts
 * 主菜单视图
 */

import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, easing } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { EventName } from '../../const/EventName';

const { ccclass, property } = _decorator;

@ccclass('HomeView')
export class HomeView extends BaseView {

    protected addEvents(): void {
        App.event.on(EventName.SCORE_UPDATE, this.onScoreUpdate, this);
    }

    protected onLoad(): void {
        super.onLoad();
        // 自定义初始化
        this.playTitleAnim();
    }

    private playTitleAnim(): void {
        const title = this.getNode('Img_Title');
        if (title) {
            title.scale = Vec3.ZERO;
            tween(title)
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
        }
    }

    /**
     * 点击开始按钮
     * 命名规范：Btn_xxx → onClick_xxx
     */
    protected onClick_BtnStart(): void {
        App.startGame();
    }

    /**
     * 点击设置按钮
     */
    protected onClick_BtnSettings(): void {
        App.showSettings();
    }

    private onScoreUpdate(score: number): void {
        const label = this.getNode('Label_Score');
        if (label) {
            label.getComponent(Label).string = `最高分: ${score}`;
        }
    }

    public onClose(): void {
        super.onClose();
    }
}
