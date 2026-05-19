/**
 * PauseView.ts
 * 暂停界面（代码动态创建UI）
 */

import { _decorator, Color } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { ViewName } from '../../const/ViewName';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('PauseView')
export class PauseView extends BaseView {

    protected onLoad(): void {
        this.isPlayOpenAnim = false;
        this.isMask = true;
        this.isTouchSpaceClose = false;
        super.onLoad();
        this.buildUI();
    }

    private buildUI(): void {
        // 弹窗
        const panel = UIHelper.createColorNode('Panel', 360, 300, new Color(50, 40, 75, 240), this.node);

        // 标题
        UIHelper.createLabel('Label_Title', '暂停', 40, Color.WHITE, panel)
            .setPosition(0, 100, 0);

        // 继续按钮
        UIHelper.createButton('Btn_Resume', 220, 56, new Color(80, 200, 120, 255), '继续游戏', 28, panel)
            .setPosition(0, 20, 0);

        // 重新开始按钮
        UIHelper.createButton('Btn_Restart', 220, 56, new Color(255, 160, 40, 255), '重新开始', 28, panel)
            .setPosition(0, -50, 0);

        // 返回主页按钮
        UIHelper.createButton('Btn_Home', 220, 56, new Color(100, 80, 140, 200), '返回主页', 28, panel)
            .setPosition(0, -120, 0);
    }

    protected onClick_BtnResume(): void {
        App.game.resumeGame();
        App.view.closeView(ViewName.pauseView);
    }

    protected onClick_BtnHome(): void {
        App.game.resumeGame();
        App.view.closeView(ViewName.gameView);
        App.view.closeView(ViewName.pauseView);
        App.view.openView(ViewName.homeView);
    }

    protected onClick_BtnRestart(): void {
        App.game.resumeGame();
        App.view.closeView(ViewName.pauseView);
        App.game.startGame();
    }
}
