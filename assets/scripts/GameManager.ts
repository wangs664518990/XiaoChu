/**
 * GameManager.ts
 * 游戏主控制器 - 核心游戏逻辑
 */

import {
    _decorator, Component, Node, Sprite, SpriteFrame,
    Vec3, Vec2, tween, Tween, UIOpacity, Color,
    instantiate, Prefab, resources, NodePool
} from 'cc';
import { GameConfig, ScoreConfig } from './GameConfig';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private static instance: GameManager | null = null;

    // 棋盘数据
    private board: (Node | null)[][] = [];

    // 当前预览方块
    private previewBlock: Node | null = null;
    private previewType: number = 0;

    // 分数
    private score: number = 0;

    // 物理模拟的方块(在棋盘外的)
    private activeBlocks: Node[] = [];

    // 是否正在游戏
    private isPlaying: boolean = false;

    // 方块SpriteFrame缓存
    private blockFrames: Map<string, SpriteFrame> = new Map();

    onLoad() {
        GameManager.instance = this;
        this.initBoard();
        this.preloadBlockSprites();
    }

    start() {
        this.startGame();
    }

    // ========== 单例 ==========
    public static getInstance(): GameManager {
        return GameManager.instance!;
    }

    // ========== 初始化 ==========
    private initBoard() {
        // 初始化6x12棋盘
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            this.board[x] = [];
            for (let y = 0; y < GameConfig.BOARD_HEIGHT; y++) {
                this.board[x][y] = null;
            }
        }
    }

    private async preloadBlockSprites() {
        // 加载所有方块精灵
        const allBlocks = [...GameConfig.BLOCK_TYPES, ...GameConfig.SPECIAL_BLOCKS];
        for (const blockType of allBlocks) {
            try {
                const url = `sprites/block_${blockType}`;
                const sf = await new Promise<SpriteFrame>((resolve, reject) => {
                    resources.load(url, SpriteFrame, (err, asset) => {
                        if (err) reject(err);
                        else resolve(asset!);
                    });
                });
                this.blockFrames.set(blockType, sf);
            } catch (e) {
                console.warn(`Failed to load sprite: block_${blockType}`);
            }
        }
    }

    // ========== 游戏控制 ==========
    public startGame() {
        this.isPlaying = true;
        this.score = 0;
        this.clearBoard();
        this.updateScoreDisplay();
        this.spawnPreview();
        console.log('🎮 游戏开始！');
    }

    public pauseGame() {
        this.isPlaying = false;
    }

    public resumeGame() {
        this.isPlaying = true;
    }

    // ========== 方块生成 ==========
    private spawnPreview() {
        // 随机选择方块类型
        const availableTypes = GameConfig.BLOCK_TYPES.slice(0, 4); // 前4种
        this.previewType = Math.floor(Math.random() * availableTypes.length);
        const typeName = availableTypes[this.previewType];

        // 清理旧预览
        if (this.previewBlock) {
            this.previewBlock.destroy();
        }

        // 创建预览方块
        resources.load(`sprites/block_${typeName}`, SpriteFrame, (err, sf) => {
            if (err || !sf) return;
            const node = new Node();
            node.addComponent(Sprite).spriteFrame = sf as SpriteFrame;
            node.setPosition(GameConfig.DROP_POS_X, GameConfig.PREVIEW_POS_Y, 0);
            node.parent = this.node;
            this.previewBlock = node;
        });
    }

    // ========== 方块下落 ==========
    public dropBlock(x: number) {
        if (!this.isPlaying || !this.previewBlock) return;

        const typeName = GameConfig.BLOCK_TYPES[this.previewType];

        // 克隆预览方块作为实际下落方块
        const block = instantiate(this.previewBlock);
        block.parent = this.node;

        // 移动到点击位置
        const dropX = x;
        const dropY = GameConfig.PREVIEW_POS_Y;
        block.setPosition(dropX, dropY, 0);

        // 标记为活动方块
        this.activeBlocks.push(block);

        // 物理下落(简化版：直线下落 + 碰撞检测)
        this.fallBlock(block, dropX);
    }

    private fallBlock(block: Node, startX: number) {
        const speed = GameConfig.DROP_SPEED;
        let currentY = startY;
        const step = 5; // 每帧移动像素
        let landed = false;

        const fall = () => {
            if (!this.isPlaying) return;

            currentY -= step;

            // 检测碰撞
            const gridX = this.getGridX(block.position.x);
            const gridY = this.getGridY(currentY);

            // 检查是否碰到棋盘底部
            if (gridY <= 0) {
                this.landBlock(block, gridX, 0);
                landed = true;
                return;
            }

            // 检查是否碰到其他方块
            if (gridY < GameConfig.BOARD_HEIGHT && this.board[gridX][gridY]) {
                this.landBlock(block, gridX, gridY + 1);
                landed = true;
                return;
            }

            block.setPosition(startX, currentY, 0);

            if (!landed) {
                setTimeout(fall, 16); // ~60fps
            }
        };

        fall();
    }

    private landBlock(block: Node, gridX: number, gridY: number) {
        // 限制在棋盘范围内
        gridX = Math.max(0, Math.min(GameConfig.BOARD_WIDTH - 1, gridX));
        gridY = Math.max(0, Math.min(GameConfig.BOARD_HEIGHT - 1, gridY));

        // 放到网格位置
        const worldPos = this.gridToWorld(gridX, gridY);
        block.setPosition(worldPos.x, worldPos.y, 0);

        // 从活动列表移除
        const idx = this.activeBlocks.indexOf(block);
        if (idx >= 0) this.activeBlocks.splice(idx, 1);

        // 检查是否和下方方块类型相同 → 合并
        const blockType = GameConfig.BLOCK_TYPES[this.previewType];
        if (this.checkMerge(gridX, gridY, blockType)) {
            return; // 合并后不放置
        }

        // 放入棋盘
        this.board[gridX][gridY] = block;

        // 检查游戏结束
        if (this.checkGameOver()) {
            this.gameOver();
            return;
        }

        // 生成下一个预览
        this.spawnPreview();
    }

    // ========== 合并检测 ==========
    private checkMerge(gridX: number, gridY: number, typeName: string): boolean {
        // 检查上下左右四个方向是否有相同类型
        const neighbors = [
            { x: gridX - 1, y: gridY },
            { x: gridX + 1, y: gridY },
            { x: gridX, y: gridY - 1 },
            { x: gridX, y: gridY + 1 },
        ];

        for (const n of neighbors) {
            if (n.x < 0 || n.x >= GameConfig.BOARD_WIDTH) continue;
            if (n.y < 0 || n.y >= GameConfig.BOARD_HEIGHT) continue;

            const neighbor = this.board[n.x][n.y];
            if (neighbor && neighbor.name.includes(typeName)) {
                // 找到相邻的相同类型 → 合并！
                this.mergeBlocks(gridX, gridY, n.x, n.y, typeName);
                return true;
            }
        }

        return false;
    }

    private mergeBlocks(x1: number, y1: number, x2: number, y2: number, typeName: string) {
        const b1 = this.board[x1][y1];
        const b2 = this.board[x2][y2];

        if (!b1 || !b2) return;

        // 计算中点
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2;
        const midWorld = this.gridToWorld(midX, midY);

        // 移动两个方块到中点并消失
        const mergeDuration = 0.2;

        tween(b1).to(mergeDuration, { position: new Vec3(midWorld.x, midWorld.y, 0) }).start();
        tween(b2).to(mergeDuration, { position: new Vec3(midWorld.x, midWorld.y, 0) }).start();

        setTimeout(() => {
            b1.destroy();
            b2.destroy();
            this.board[x1][y1] = null;
            this.board[x2][y2] = null;

            // 提升分数
            this.addScore(ScoreConfig.PER_BLOCK * 2);

            // 检查连锁
            this.checkMatches();

            // 生成下一个预览
            this.spawnPreview();
        }, mergeDuration * 1000);
    }

    // ========== 消除检测 ==========
    private checkMatches() {
        // BFS查找连通块
        const visited = new Set<string>();
        const matchList: { x: number, y: number }[] = [];

        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            for (let y = 0; y < GameConfig.BOARD_HEIGHT; y++) {
                const key = `${x},${y}`;
                if (visited.has(key) || !this.board[x][y]) continue;

                // BFS找连通块
                const block = this.board[x][y];
                const blockType = block.name;
                const connected: { x: number, y: number }[] = [];
                const queue: { x: number, y: number }[] = [{ x, y }];

                while (queue.length > 0) {
                    const cur = queue.shift()!;
                    const curKey = `${cur.x},${cur.y}`;
                    if (visited.has(curKey)) continue;
                    if (cur.x < 0 || cur.x >= GameConfig.BOARD_WIDTH) continue;
                    if (cur.y < 0 || cur.y >= GameConfig.BOARD_HEIGHT) continue;
                    const curBlock = this.board[cur.x][cur.y];
                    if (!curBlock || !curBlock.name.includes(blockType)) continue;

                    visited.add(curKey);
                    connected.push(cur);

                    queue.push({ x: cur.x - 1, y: cur.y });
                    queue.push({ x: cur.x + 1, y: cur.y });
                    queue.push({ x: cur.x, y: cur.y - 1 });
                    queue.push({ x: cur.x, y: cur.y + 1 });
                }

                // 3个以上 → 消除
                if (connected.length >= GameConfig.MIN_MATCH) {
                    matchList.push(...connected);
                }
            }
        }

        if (matchList.length > 0) {
            this.eliminateBlocks(matchList);
        }
    }

    private eliminateBlocks(blocks: { x: number, y: number }[]) {
        const duration = 0.3;

        // 消除动画
        for (const pos of blocks) {
            const block = this.board[pos.x][pos.y];
            if (!block) continue;

            tween(block)
                .to(duration, { scale: new Vec3(1.5, 1.5, 1), opacity: 0 })
                .call(() => block.destroy())
                .start();

            this.board[pos.x][pos.y] = null;
        }

        // 分数
        const combo = blocks.length >= 6 ? ScoreConfig.COMBO_MULTI : 1;
        this.addScore(Math.floor(blocks.length * ScoreConfig.PER_BLOCK * combo));

        // 延迟后下落填补空缺
        setTimeout(() => {
            this.applyGravity();
            setTimeout(() => this.checkMatches(), 300);
        }, duration * 1000);
    }

    // ========== 重力 ==========
    private applyGravity() {
        // 每列从上到下检查，空的往下填
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            let writeY = 0;
            for (let readY = 0; readY < GameConfig.BOARD_HEIGHT; readY++) {
                const block = this.board[x][readY];
                if (block) {
                    if (writeY !== readY) {
                        // 移动到新位置
                        const newPos = this.gridToWorld(x, writeY);
                        tween(block).to(0.15, { position: new Vec3(newPos.x, newPos.y, 0) }).start();
                        this.board[x][writeY] = block;
                        this.board[x][readY] = null;
                    }
                    writeY++;
                }
            }
        }
    }

    // ========== 分数 ==========
    private addScore(points: number) {
        this.score += points;
        this.updateScoreDisplay();
    }

    private updateScoreDisplay() {
        // 通知UI更新
        this.node.emit('scoreChanged', this.score);
    }

    // ========== 游戏结束 ==========
    private checkGameOver(): boolean {
        // 如果最顶层有方块 → 游戏结束
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            if (this.board[x][GameConfig.BOARD_HEIGHT - 1]) {
                return true;
            }
        }
        return false;
    }

    private gameOver() {
        this.isPlaying = false;
        console.log('💀 游戏结束！分数:', this.score);
        this.node.emit('gameOver', this.score);
    }

    private clearBoard() {
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            for (let y = 0; y < GameConfig.BOARD_HEIGHT; y++) {
                if (this.board[x][y]) {
                    this.board[x][y].destroy();
                    this.board[x][y] = null;
                }
            }
        }
        for (const block of this.activeBlocks) {
            block.destroy();
        }
        this.activeBlocks = [];
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }
    }

    // ========== 工具方法 ==========
    private getGridX(worldX: number): number {
        return Math.floor((worldX - GameConfig.BOARD_OFFSET_X + 
            (GameConfig.BOARD_WIDTH * GameConfig.CELL_SIZE) / 2) / GameConfig.CELL_SIZE);
    }

    private getGridY(worldY: number): number {
        return Math.floor((GameConfig.BOARD_OFFSET_Y + 
            (GameConfig.BOARD_HEIGHT * GameConfig.CELL_SIZE) - worldY) / GameConfig.CELL_SIZE);
    }

    private gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
        const x = GameConfig.BOARD_OFFSET_X - 
            (GameConfig.BOARD_WIDTH * GameConfig.CELL_SIZE) / 2 + 
            gridX * GameConfig.CELL_SIZE + GameConfig.CELL_SIZE / 2;
        const y = GameConfig.BOARD_OFFSET_Y + 
            (GameConfig.BOARD_HEIGHT * GameConfig.CELL_SIZE) - 
            gridY * GameConfig.CELL_SIZE - GameConfig.CELL_SIZE / 2;
        return { x, y };
    }

    public getScore(): number {
        return this.score;
    }
}
