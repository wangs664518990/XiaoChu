/**
 * GameView.ts
 * 游戏主界面视图（代码动态创建UI）
 */

import { _decorator, Node, Label, Color, Sprite, SpriteFrame, EventTouch, Vec3, tween, resources, UITransform, Widget } from 'cc';
import { BaseView } from '../../components/BaseView';
import { App } from '../../App';
import { EventName } from '../../const/EventName';
import { GameManager } from '../GameManager';
import {
    BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, BOARD_OFFSET_Y,
    BLOCK_TYPES
} from '../../const/GameConfig';
import { UIHelper } from '../../utils/UIHelper';

const { ccclass } = _decorator;

@ccclass('GameView')
export class GameView extends BaseView {

    private scoreLabel: Label | null = null;
    private gameNode: Node | null = null;
    private boardBg: Node | null = null;
    private previewNode: Node | null = null;

    protected onLoad(): void {
        this.isPlayOpenAnim = false;
        super.onLoad();
        this.buildUI();
        this.bindTouchInput();

        // 预加载方块精灵
        this.preloadBlockSprites();
    }

    private buildUI(): void {
        // 背景
        UIHelper.createColorNode('Bg', 720, 1280, new Color(30, 25, 50, 255), this.node);

        // 棋盘区域背景
        const boardW = BOARD_WIDTH * CELL_SIZE + 16;
        const boardH = BOARD_HEIGHT * CELL_SIZE + 16;
        this.boardBg = UIHelper.createColorNode('Board', boardW, boardH, new Color(20, 18, 35, 200), this.node);
        this.boardBg.setPosition(0, BOARD_OFFSET_Y - 10, 0);

        // 棋盘网格线
        this.drawGrid();

        // GameNode - 方块容器
        this.gameNode = UIHelper.createNode('GameNode', boardW, boardH, this.node);
        this.gameNode.setPosition(0, BOARD_OFFSET_Y - 10, 0);

        // 顶部UI栏
        UIHelper.setWidgetTop(
            UIHelper.createColorNode('TopBar', 720, 80, new Color(0, 0, 0, 100), this.node)
        );

        // 分数标签
        const scoreNode = UIHelper.createLabel('Label_Score', '0', 36, Color.WHITE, this.node);
        scoreNode.setPosition(-200, 330, 0);
        UIHelper.setWidgetTop(scoreNode);
        (scoreNode.getComponent(UITransform) || scoreNode.addComponent(UITransform)).setContentSize(200, 40);
        this.scoreLabel = scoreNode.getComponent(Label);

        // "分数"标签
        UIHelper.createLabel('Label_ScoreTitle', '分数', 18, new Color(200, 200, 200, 200), this.node)
            .setPosition(-200, 365, 0);

        // 暂停按钮
        UIHelper.createButton('Btn_Pause', 80, 50, new Color(80, 70, 120, 200), '暂停', 22, this.node)
            .setPosition(280, 340, 0);

        // 预览区域提示
        this.previewNode = UIHelper.createLabel('Label_Preview', '预览方块', 16, new Color(180, 180, 200, 150), this.node);
        this.previewNode.setPosition(0, 440, 0);

        // 触摸区域（全屏）
        const touchZone = UIHelper.createNode('TouchZone', 720, 1280, this.node);
        touchZone.setPosition(0, 0, 0);
        touchZone.on(Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private drawGrid(): void {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if ((x + y) % 2 === 0) {
                    const cellSize = CELL_SIZE;
                    const wx = -(BOARD_WIDTH * cellSize) / 2 + x * cellSize + cellSize / 2;
                    const wy = BOARD_OFFSET_Y + BOARD_HEIGHT * cellSize - y * cellSize - cellSize / 2 - 10;
                    UIHelper.createColorNode(
                        `Cell_${x}_${y}`, cellSize - 1, cellSize - 1,
                        new Color(40, 35, 60, 255), this.boardBg!
                    ).setPosition(wx, wy, 0);
                }
            }
        }
    }

    private preloadBlockSprites(): void {
        for (const type of BLOCK_TYPES) {
            const path = `sprites/block_${type}`;
            resources.load(path, SpriteFrame, (err: any, sf: any) => {
                if (!err && sf) {
                    GameManager.getInstance().setSpriteFrame(type, sf);
                }
            });
        }
    }

    protected addEvents(): void {
        App.event.on(EventName.SCORE_UPDATE, this.onScoreUpdate, this);
        App.event.on(EventName.GAME_OVER, this.onGameOver, this);
    }

    public loadExtraData(...args: any): void {
        super.loadExtraData(...args);
        // 设置游戏根节点并启动
        if (this.gameNode) {
            App.game.setGameRoot(this.gameNode);
        }
        setTimeout(() => App.game.startGame(), 100);
    }

    private onTouchEnd(event: EventTouch): void {
        if (!App.game.isRunning()) return;
        const uiLoc = event.getUILocation();
        App.game.dropBlock(uiLoc.x);
    }

    private onScoreUpdate(score: number): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `${score}`;
        }
    }

    private onGameOver(score: number, highScore: number): void {
        tween(this.boardBg!)
            .to(0.3, { scale: new Vec3(1, 1, 1) })
            .start();

        setTimeout(() => App.showResult(score), 500);
    }

    protected onClick_BtnPause(): void {
        App.game.pauseGame();
        App.view.openView('prefab/view/pauseView');
    }

    public onDestroy(): void {
        super.onDestroy();
        App.event.offAll(this);
    }
}
