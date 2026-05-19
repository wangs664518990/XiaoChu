/**
 * ResultView.ts
 * 结果/结算界面（代码动态创建UI）
 */

import { _decorator, Label, Color, Vec3, tween, easing } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { ViewName } from '../../const/ViewName';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('ResultView')
export class ResultView extends BaseView {

    private finalScoreLabel: Label | null = null;
    private highScoreLabel: Label | null = null;

    protected onLoad(): void {
        this.isPlayOpenAnim = false;
        this.isMask = true;
        this.isTouchSpaceClose = false;
        super.onLoad();
        this.buildUI();
        this.playScoreAnim();
    }

    private buildUI(): void {
        // 弹窗背景
        const panel = UIHelper.createColorNode('Panel', 400, 360, new Color(50, 40, 75, 240), this.node);
        panel.setScale(0, 0, 0);
        tween(panel).to(0.3, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut }).start();

        // 标题
        UIHelper.createLabel('Label_Title', '游戏结束', 40, new Color(255, 100, 100, 255), panel)
            .setPosition(0, 120, 0);

        // 最终分数
        const scoreNode = UIHelper.createLabel('Label_FinalScore', '0', 64, new Color(255, 220, 60, 255), panel);
        scoreNode.setPosition(0, 40, 0);
        this.finalScoreLabel = scoreNode.getComponent(Label);

        // 最高分
        const highNode = UIHelper.createLabel('Label_HighScore', '最高分: 0', 24, new Color(200, 200, 220, 200), panel);
        highNode.setPosition(0, -20, 0);
        this.highScoreLabel = highNode.getComponent(Label);

        // 重新开始按钮
        UIHelper.createButton('Btn_Restart', 220, 56, new Color(255, 160, 40, 255), '再来一局', 28, panel)
            .setPosition(0, -90, 0);

        // 返回主页按钮
        UIHelper.createButton('Btn_Home', 220, 56, new Color(80, 70, 120, 200), '返回主页', 28, panel)
            .setPosition(0, -155, 0);
    }

    private playScoreAnim(): void {
        // 从loadExtraData中拿分数
        if (!this.extraData || this.extraData.length === 0) return;
        const score = this.extraData[0] || 0;
        const highScore = this.extraData[1] || score;

        if (this.finalScoreLabel) {
            this.finalScoreLabel.string = `${score}`;
        }
        if (this.highScoreLabel) {
            this.highScoreLabel.string = `最高分: ${highScore}`;
        }
    }

    protected onClick_BtnRestart(): void {
        App.startGame();
    }

    protected onClick_BtnHome(): void {
        App.backHome();
    }
}
