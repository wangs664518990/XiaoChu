/**
 * MainScene.ts
 * 主场景控制器 - UI搭建和事件绑定
 */

import {
    _decorator, Component, Node, Sprite, SpriteFrame,
    Label, Button, Color, Vec3,
    resources, instantiate, tween, UIOpacity, UITransform
} from 'cc';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {

    private scoreLabel: Node | null = null;
    private gameContainer: Node | null = null;
    private isPaused: boolean = false;

    start() {
        this.setupUI();
        this.setupTouch();
        this.setupGameEvents();
        this.showMenu();
    }

    // ========== UI 搭建 ==========
    private setupUI() {
        // 背景
        const bg = new Node('BG');
        bg.parent = this.node;
        const bgTrans = bg.addComponent(UITransform);
        bgTrans.setContentSize(720, 1280);
        bg.addComponent(Sprite);

        // 分数
        this.scoreLabel = new Node('ScoreLabel');
        this.scoreLabel.parent = this.node;
        const lbl = this.scoreLabel.addComponent(Label);
        lbl.string = '分数: 0';
        lbl.fontSize = 36;
        lbl.color = new Color(255, 215, 0);
        lbl.bold = true;
        this.scoreLabel.setPosition(0, 600, 0);

        // 游戏容器
        this.gameContainer = new Node('GameContainer');
        this.gameContainer.parent = this.node;

        // GameManager
        const gmNode = new Node('GameManager');
        gmNode.parent = this.gameContainer;
        gmNode.addComponent(GameManager);

        // 点击下落区域
        const touchZone = new Node('TouchZone');
        touchZone.parent = this.node;
        touchZone.addComponent(UITransform).setContentSize(720, 700);
        touchZone.setPosition(0, 150, 0);

        const btn = touchZone.addComponent(Button);
        btn.interactable = true;
        btn.clickEvents = [];

        touchZone.on(Node.EventType.TOUCH_END, (event: any) => {
            const touch = event.touch;
            if (!touch) return;
            const worldPos = touch.getLocation();
            const gm = GameManager.getInstance();
            if (gm) {
                gm.dropBlock(worldPos.x - 360); // 居中偏移
            }
        }, this);

        // 底部按钮
        this.createButton('重新开始', 0, -550, () => this.restartGame(), this.node);
        this.createButton('暂停/继续', -150, -620, () => this.togglePause(), this.node);
    }

    private createButton(
        label: string, x: number, y: number, callback: () => void, parent: Node
    ): Node {
        const btnNode = new Node('Btn_' + label);
        btnNode.parent = parent;
        btnNode.addComponent(UITransform).setContentSize(220, 60);

        const spr = btnNode.addComponent(Sprite);
        spr.color = new Color(60, 60, 80);

        const btn = btnNode.addComponent(Button);
        btn.interactable = true;

        const lblNode = new Node('Label');
        lblNode.parent = btnNode;
        const lbl = lblNode.addComponent(Label);
        lbl.string = label;
        lbl.fontSize = 24;
        lbl.color = Color.WHITE;

        btnNode.setPosition(x, y, 0);
        btnNode.on('click', callback, this);

        return btnNode;
    }

    // ========== 游戏事件 ==========
    private setupGameEvents() {
        this.node.on('scoreChanged', (score: number) => {
            if (this.scoreLabel) {
                const lbl = this.scoreLabel.getComponent(Label);
                if (lbl) lbl.string = `分数: ${score}`;
            }
        }, this);

        this.node.on('gameOver', (score: number) => {
            this.showGameOver(score);
        }, this);
    }

    // ========== 触摸（备用） ==========
    private setupTouch() {
        // 已通过setupUI中的touchZone处理
    }

    // ========== 菜单 ==========
    private showMenu() {
        const menu = new Node('Menu');
        menu.parent = this.node;

        // 遮罩
        const overlay = new Node('Overlay');
        overlay.parent = menu;
        overlay.addComponent(UITransform).setContentSize(720, 1280);
        const overlayOp = overlay.addComponent(UIOpacity);
        overlayOp.opacity = 200;

        // 标题
        const title = new Node('Title');
        title.parent = menu;
        const titleLbl = title.addComponent(Label);
        titleLbl.string = '弹跳消除';
        titleLbl.fontSize = 64;
        titleLbl.color = new Color(255, 215, 0);
        titleLbl.bold = true;
        title.setPosition(0, 200, 0);

        // 开始按钮
        this.createButton('开始游戏', 0, -50, () => {
            menu.destroy();
            GameManager.getInstance()?.startGame();
        }, menu);

        // 提示
        const hint = new Node('Hint');
        hint.parent = menu;
        const hintLbl = hint.addComponent(Label);
        hintLbl.string = '点击屏幕放下方块\n相同颜色碰在一起会合并\n3个以上连线消除';
        hintLbl.fontSize = 28;
        hintLbl.color = Color.WHITE;
        hint.setPosition(0, -250, 0);
    }

    // ========== 游戏结束 ==========
    private showGameOver(score: number) {
        const overlay = new Node('GameOverOverlay');
        overlay.parent = this.node;
        overlay.addComponent(UITransform).setContentSize(720, 1280);
        const op = overlay.addComponent(UIOpacity);
        op.opacity = 0;
        tween(op).to(0.3, { opacity: 200 }).start();

        // 标题
        const goLabel = new Node('GOLabel');
        goLabel.parent = overlay;
        const goLbl = goLabel.addComponent(Label);
        goLbl.string = '游戏结束';
        goLbl.fontSize = 72;
        goLbl.color = new Color(255, 80, 80);
        goLbl.bold = true;
        goLabel.setPosition(0, 200, 0);

        // 分数
        const scoreLabel = new Node('ScoreLabel');
        scoreLabel.parent = overlay;
        const scoreLbl = scoreLabel.addComponent(Label);
        scoreLbl.string = `最终分数: ${score}`;
        scoreLbl.fontSize = 48;
        scoreLbl.color = new Color(255, 215, 0);
        scoreLbl.bold = true;
        scoreLabel.setPosition(0, 50, 0);

        // 重新开始
        this.createButton('再来一局', 0, -150, () => {
            overlay.destroy();
            GameManager.getInstance()?.startGame();
        }, overlay);
    }

    private restartGame() {
        const gm = GameManager.getInstance();
        if (gm) {
            gm.startGame();
        }
    }

    private togglePause() {
        const gm = GameManager.getInstance();
        if (!gm) return;
        if (this.isPaused) {
            gm.resumeGame();
            this.isPaused = false;
        } else {
            gm.pauseGame();
            this.isPaused = true;
        }
    }
}
