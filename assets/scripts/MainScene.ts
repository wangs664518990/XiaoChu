/**
 * MainScene.ts
 * 主场景控制器 - 负责UI搭建和事件绑定
 */

import {
    _decorator, Component, Node, Sprite, SpriteFrame,
    Label, Button, Color, Vec3, UIOpacity,
    resources, instantiate, tween, UITransform
} from 'cc';
import { GameConfig, ScoreConfig, LevelConfig } from './GameConfig';
import { GameManager } from './GameManager';

const { ccclass, property } = _decorator;

@ccclass('MainScene')
export class MainScene extends Component {

    private scoreLabel: Node | null = null;
    private livesNode: Node | null = null;
    private dropZone: Node | null = null;
    private previewArea: Node | null = null;
    private gameContainer: Node | null = null;

    private lives: number = 3;

    start() {
        this.setupUI();
        this.setupTouch();
        this.setupGameEvents();

        // 显示主菜单
        this.showMenu();
    }

    // ========== UI 搭建 ==========
    private setupUI() {
        const canvas = this.node;
        const bgColor = new Color(20, 15, 40); // 深紫蓝背景
        this.node.getComponent(UITransform)?.setContentSize(720, 1280);

        // 创建背景
        const bg = new Node('BG');
        bg.parent = canvas;
        bg.addComponent(UITransform).setContentSize(720, 1280);
        const bgSpr = bg.addComponent(Sprite);
        bgSpr.color = bgColor;

        // 创建分数区域(顶部)
        this.createScoreArea(canvas);

        // 创建游戏容器
        this.gameContainer = new Node('GameContainer');
        this.gameContainer.parent = canvas;

        // 创建GameManager
        const gmNode = new Node('GameManager');
        gmNode.parent = this.gameContainer;
        const gm = gmNode.addComponent(GameManager);
        gmNode.setPosition(0, 0, 0);

        // 创建下落区域
        this.createDropZone(canvas);

        // 创建预览区域
        this.createPreviewArea(canvas);

        // 创建底部按钮
        this.createBottomButtons(canvas);
    }

    private createScoreArea(parent: Node) {
        // 顶部状态栏
        const topBar = new Node('TopBar');
        topBar.parent = parent;

        // 分数标签
        this.scoreLabel = new Node('ScoreLabel');
        this.scoreLabel.parent = topBar;
        const scoreLbl = this.scoreLabel.addComponent(Label);
        scoreLbl.string = '分数: 0';
        scoreLbl.fontSize = 36;
        scoreLbl.color = new Color(255, 215, 0); // 金色
        scoreLbl.bold = true;
        this.scoreLabel.setPosition(0, 600, 0);
    }

    private createDropZone(parent: Node) {
        // 点击下落区域
        this.dropZone = new Node('DropZone');
        this.dropZone.parent = parent;
        const transform = this.dropZone.addComponent(UITransform);
        transform.setContentSize(720, 700);
        this.dropZone.setPosition(0, 200, 0);

        // 添加点击组件
        const button = this.dropZone.addComponent(Button);
        button.interactable = true;
        button.transition = Button.Transition.NONE;
    }

    private createPreviewArea(parent: Node) {
        // 预览区域(顶部)
        this.previewArea = new Node('PreviewArea');
        this.previewArea.parent = parent;
        this.previewArea.setPosition(0, 500, 0);
    }

    private createBottomButtons(parent: Node) {
        // 底部控制区
        const bottomBar = new Node('BottomBar');
        bottomBar.parent = parent;

        // 重新开始按钮
        const restartBtn = this.createButton('重新开始', 0, -550, () => {
            this.restartGame();
        });
        restartBtn.parent = bottomBar;

        // 暂停按钮
        const pauseBtn = this.createButton('暂停', -150, -550, () => {
            this.togglePause();
        });
        pauseBtn.parent = bottomBar;
    }

    private createButton(label: string, x: number, y: number, callback: () => void): Node {
        const btnNode = new Node('Button_' + label);
        const transform = btnNode.addComponent(UITransform);
        transform.setContentSize(200, 60);

        const sprite = btnNode.addComponent(Sprite);
        sprite.color = new Color(60, 60, 80);

        const button = btnNode.addComponent(Button);
        button.interactable = true;

        // 标签
        const labelNode = new Node('Label');
        labelNode.parent = btnNode;
        const lbl = labelNode.addComponent(Label);
        lbl.string = label;
        lbl.fontSize = 28;
        lbl.color = Color.WHITE;

        btnNode.setPosition(x, y, 0);
        btnNode.on('click', callback, this);

        return btnNode;
    }

    // ========== 触摸处理 ==========
    private setupTouch() {
        if (!this.dropZone) return;

        // 点击任意位置下落
        this.dropZone.on(Node.EventType.TOUCH_END, (event: any) => {
            if (!GameManager.getInstance()) return;

            const touch = event.touch;
            const worldPos = touch.getLocation();
            const localPos = this.node.getComponent(UITransform)!.convertToNodeSpaceAR(
                new Vec3(worldPos.x, worldPos.y, 0)
            );

            // 转换到棋盘坐标
            const boardX = localPos.x;
            GameManager.getInstance().dropBlock(boardX);
        }, this);
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

    // ========== 菜单 ==========
    private showMenu() {
        const menu = new Node('Menu');
        menu.parent = this.node;

        // 半透明遮罩
        const overlay = new Node('Overlay');
        overlay.parent = menu;
        overlay.addComponent(UITransform).setContentSize(720, 1280);
        const overlaySpr = overlay.addComponent(Sprite);
        overlaySpr.color = new Color(0, 0, 0, 180);

        // 标题
        const title = new Node('Title');
        title.parent = menu;
        const titleLbl = title.addComponent(Label);
        titleLbl.string = '🎮 弹跳消除';
        titleLbl.fontSize = 64;
        titleLbl.color = new Color(255, 215, 0);
        titleLbl.bold = true;
        title.setPosition(0, 200, 0);

        // 开始按钮
        const startBtn = this.createButton('开始游戏', 0, -50, () => {
            menu.destroy();
            GameManager.getInstance()?.startGame();
        });
        startBtn.parent = menu;

        // 提示
        const hint = new Node('Hint');
        hint.parent = menu;
        const hintLbl = hint.addComponent(Label);
        hintLbl.string = '点击屏幕放下方块\n相同方块碰在一起会合并\n3个以上相同方块连线消除';
        hintLbl.fontSize = 28;
        hintLbl.color = Color.WHITE;
        hintLbl.horizontalAlign = Label.HorizontalAlign.CENTER;
        hint.setPosition(0, -200, 0);
    }

    // ========== 游戏结束 ==========
    private showGameOver(score: number) {
        const overlay = new Node('GameOverOverlay');
        overlay.parent = this.node;
        overlay.addComponent(UITransform).setContentSize(720, 1280);
        overlay.addComponent(UIOpacity).opacity = 0;

        // 淡入
        tween(overlay.getComponent(UIOpacity)!)
            .to(0.3, { opacity: 200 })
            .start();

        // 游戏结束标签
        const goLabel = new Node('GOLabel');
        goLabel.parent = overlay;
        const goLbl = goLabel.addComponent(Label);
        goLbl.string = '💀 游戏结束';
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
        const restartBtn = this.createButton('再来一局', 0, -150, () => {
            overlay.destroy();
            GameManager.getInstance()?.startGame();
        });
        restartBtn.parent = overlay;
    }

    private restartGame() {
        GameManager.getInstance()?.startGame();
    }

    private togglePause() {
        // 简化：直接重新开始
        this.restartGame();
    }
}
