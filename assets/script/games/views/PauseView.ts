/**
 * PauseView.ts
 * 暂停界面
 */

import { _decorator, Component } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { ViewName } from '../../const/ViewName';

const { ccclass } = _decorator;

@ccclass('PauseView')
export class PauseView extends BaseView {

    protected onClick_BtnResume(): void {
        App.game.resumeGame();
        App.view.closeView(ViewName.pauseView);
    }

    protected onClick_BtnHome(): void {
        App.game.pauseGame();
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
