/**
 * HomeView.ts
 * 主菜单视图（代码动态创建UI）
 */

import { _decorator, Component, Node, Label, Sprite, Color, Vec3, tween, easing } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { EventName } from '../../const/EventName';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('HomeView')
export class HomeView extends BaseView {

    private titleLabel: Label | null = null;
    private scoreLabel: Label | null = null;

    protected addEvents(): void {
        App.event.on(EventName.SCORE_UPDATE, this.onScoreUpdate, this);
    }

    protected onLoad(): void {
        // 先不做BaseView的openAnim，我们自己控制
        this.isPlayOpenAnim = false;
        super.onLoad();
        this.buildUI();
        this.playTitleAnim();
    }

    private buildUI(): void {
        // 背景渐变（深蓝紫）
        UIHelper.createColorNode('Bg', 720, 1280, new Color(45, 30, 70, 255), this.node);

        // 标题
        const titleNode = UIHelper.createLabel('Img_Title', '弹跳消除', 52, new Color(255, 220, 60, 255), this.node);
        titleNode.setPosition(0, 200, 0);
        this.titleLabel = titleNode.getComponent(Label);

        // 副标题
        UIHelper.createLabel('Label_SubTitle', '点击屏幕释放方块，3个相连即消除！', 22, new Color(200, 200, 220, 255), this.node)
            .setPosition(0, 130, 0);

        // 最高分
        const scoreNode = UIHelper.createLabel('Label_Score', '最高分: 0', 28, new Color(255, 255, 255, 200), this.node);
        scoreNode.setPosition(0, 50, 0);
        this.scoreLabel = scoreNode.getComponent(Label);

        // 开始按钮
        const btnStart = UIHelper.createButton('Btn_Start', 260, 72, new Color(255, 160, 40, 255), '开始游戏', 32, this.node);
        btnStart.setPosition(0, -60, 0);

        // 设置按钮
        const btnSettings = UIHelper.createButton('Btn_Settings', 180, 56, new Color(80, 70, 120, 255), '设置', 24, this.node);
        btnSettings.setPosition(0, -160, 0);

        // 装饰方块
        this.buildDecoBlocks();
    }

    private buildDecoBlocks(): void {
        const colors = [
            new Color(255, 80, 80, 180),    // red
            new Color(255, 160, 50, 180),   // orange
            new Color(255, 230, 50, 180),   // yellow
            new Color(80, 200, 80, 180),    // green
            new Color(80, 140, 255, 180),   // blue
            new Color(180, 80, 255, 180),   // purple
        ];

        // 底部装饰一排小方块
        const startX = -5 * 35 / 2;
        for (let i = 0; i < 6; i++) {
            const block = UIHelper.createColorNode('Deco_' + i, 30, 30, colors[i], this.node);
            block.setPosition(startX + i * 35, -400 + (i % 2 === 0 ? 0 : 20), 0);
        }
    }

    private playTitleAnim(): void {
        const title = this.getNode('Img_Title');
        if (title) {
            title.setScale(Vec3.ZERO);
            tween(title)
                .to(0.4, { scale: new Vec3(1, 1, 1) }, { easing: easing.backOut })
                .start();
        }
    }

    /**
     * 点击开始按钮 (Btn_Start)
     */
    protected onClick_BtnStart(): void {
        App.startGame();
    }

    /**
     * 点击设置按钮 (Btn_Settings)
     */
    protected onClick_BtnSettings(): void {
        App.showSettings();
    }

    private onScoreUpdate(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `最高分: ${score}`;
        }
    }

    public onClose(): void {
        super.onClose();
    }
}
