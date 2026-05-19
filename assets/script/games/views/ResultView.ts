/**
 * ResultView.ts
 * 结果/结算界面
 */

import { _decorator, Component, Label, Color, Vec3, tween, easing } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { ViewName } from '../../const/ViewName';

const { ccclass } = _decorator;

@ccclass('ResultView')
export class ResultView extends BaseView {

    protected onLoad(): void {
        super.onLoad();
        this.playScoreAnim();
    }

    private playScoreAnim(): void {
        const scoreLabel = this.getNode('Label_FinalScore');
        if (scoreLabel) {
            scoreLabel.setScale(0, 0, 0);
            tween(scoreLabel)
                .to(0.5, { scale: new Vec3(1.5, 1.5, 1.5) }, { easing: easing.backOut })
                .to(0.2, { scale: new Vec3(1, 1, 1) })
                .start();
        }
    }

    /**
     * 重新开始
     */
    protected onClick_BtnRestart(): void {
        App.startGame();
    }

    /**
     * 返回主页
     */
    protected onClick_BtnHome(): void {
        App.backHome();
    }
}
