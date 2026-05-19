/**
 * main.ts
 * 游戏入口脚本（挂载在Canvas上）
 */

import { _decorator, Component, Node } from 'cc';
import { App } from './App';

const { ccclass, property } = _decorator;

@ccclass('main')
export class MainEntry extends Component {

    protected onLoad(): void {
        // 初始化App
        App.init(this.node);

        // 打开主菜单
        App.view.openView('prefab/view/homeView');
    }
}
