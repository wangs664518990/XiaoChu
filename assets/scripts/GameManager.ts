/**
 * GameManager.ts
 * 游戏主控制器 - 核心游戏逻辑
 */

import {
    _decorator, Component, Node, Sprite, SpriteFrame,
    Vec3, tween, UIOpacity, Color,
    instantiate, resources
} from 'cc';
import { GameConfig, ScoreConfig, BLOCK_TYPES } from './GameConfig';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {

    private static instance: GameManager | null = null;

    // 棋盘数据: board[x][y], x=0左,y=0底
    private board: (Node | null)[][] = [];

    // 当前预览
    private previewBlock: Node | null = null;
    private previewType: number = 0;

    // 分数
    private score: number = 0;

    // 正在下落的方块
    private activeBlocks: Node[] = [];

    // 是否正在游戏
    private isPlaying: boolean = false;

    // SpriteFrame缓存
    private blockFrames: Map<string, SpriteFrame> = new Map();

    onLoad() {
        GameManager.instance = this;
        this.initBoard();
        this.preloadSprites();
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
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            this.board[x] = [];
            for (let y = 0; y < GameConfig.BOARD_HEIGHT; y++) {
                this.board[x][y] = null;
            }
        }
    }

    private async preloadSprites() {
        const allBlocks = [...BLOCK_TYPES, ...GameConfig.SPECIAL_BLOCKS];
        for (const blockType of allBlocks) {
            try {
                const url = `sprites/block_${blockType}`;
                const sf = await new Promise<SpriteFrame>((resolve) => {
                    resources.load(url, SpriteFrame, (err, asset) => {
                        if (err) { resolve(null as unknown as SpriteFrame); }
                        else { resolve(asset!); }
                    });
                });
                if (sf) {
                    this.blockFrames.set(blockType, sf);
                }
            } catch (e) {
                console.warn(`Failed to load: block_${blockType}`);
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
        const availableTypes = BLOCK_TYPES.slice(0, 4);
        this.previewType = Math.floor(Math.random() * availableTypes.length);
        const typeName = String(availableTypes[this.previewType]);

        if (this.previewBlock) {
            this.previewBlock.destroy();
        }

        const frame = this.blockFrames.get(typeName);
        if (!frame) return;

        const node = new Node(typeName);
        const sprite = node.addComponent(Sprite);
        sprite.spriteFrame = frame;
        node.setPosition(GameConfig.DROP_POS_X, GameConfig.PREVIEW_POS_Y, 0);
        node.parent = this.node;
        this.previewBlock = node;
    }

    // ========== 方块下落 ==========
    public dropBlock(x: number) {
        if (!this.isPlaying || !this.previewBlock) return;

        const frame = this.previewBlock.getComponent(Sprite)?.spriteFrame;
        const typeName = this.previewBlock.name;

        // 克隆方块
        const block = new Node(typeName);
        const sprite = block.addComponent(Sprite);
        sprite.spriteFrame = frame;
        block.parent = this.node;
        block.setPosition(x, GameConfig.PREVIEW_POS_Y, 0);

        // 保存类型
        (block as any)._blockType = typeName;

        this.activeBlocks.push(block);
        this.fallBlock(block, x);
    }

    private fallBlock(block: Node, startX: number) {
        let currentY = GameConfig.PREVIEW_POS_Y;
        const step = 8;
        let landed = false;

        const fall = () => {
            if (!this.isPlaying || landed) return;

            currentY -= step;

            const gridX = this.getGridX(block.position.x);
            const gridY = this.getGridY(currentY);

            // 触底
            if (gridY <= 0) {
                this.landBlock(block, gridX, 0);
                landed = true;
                return;
            }

            // 碰到其他方块
            if (gridY > 0 && gridY < GameConfig.BOARD_HEIGHT && this.board[gridX][gridY]) {
                this.landBlock(block, gridX, gridY + 1);
                landed = true;
                return;
            }

            block.setPosition(startX, currentY, 0);

            if (!landed) {
                setTimeout(fall, 16);
            }
        };

        fall();
    }

    private landBlock(block: Node, gridX: number, gridY: number) {
        gridX = Math.max(0, Math.min(GameConfig.BOARD_WIDTH - 1, gridX));
        gridY = Math.max(0, Math.min(GameConfig.BOARD_HEIGHT - 1, gridY));

        const worldPos = this.gridToWorld(gridX, gridY);
        block.setPosition(worldPos.x, worldPos.y, 0);

        const idx = this.activeBlocks.indexOf(block);
        if (idx >= 0) this.activeBlocks.splice(idx, 1);

        const blockType = (block as any)._blockType;

        // 合并检测
        if (this.tryMerge(block, gridX, gridY, blockType)) {
            return;
        }

        // 放入棋盘
        this.board[gridX][gridY] = block;

        if (this.checkGameOver()) {
            this.gameOver();
            return;
        }

        this.spawnPreview();
    }

    // ========== 合并 ==========
    private tryMerge(newBlock: Node, gridX: number, gridY: number, blockType: string): boolean {
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
            if (neighbor && (neighbor as any)._blockType === blockType) {
                this.doMerge(gridX, gridY, n.x, n.y, blockType);
                return true;
            }
        }
        return false;
    }

    private doMerge(x1: number, y1: number, x2: number, y2: number, blockType: string) {
        const b1 = this.board[x1][y1];
        const b2 = this.board[x2][y2];

        if (!b1 || !b2) return;

        const midWorld = this.gridToWorld((x1 + x2) / 2, (y1 + y2) / 2);
        const dur = 0.2;

        tween(b1).to(dur, { position: new Vec3(midWorld.x, midWorld.y, 0) }).start();
        tween(b2).to(dur, { position: new Vec3(midWorld.x, midWorld.y, 0) }).start();

        setTimeout(() => {
            b1.destroy();
            b2.destroy();
            this.board[x1][y1] = null;
            this.board[x2][y2] = null;
            this.addScore(ScoreConfig.PER_BLOCK * 2);
            this.checkMatches();
            this.spawnPreview();
        }, dur * 1000);
    }

    // ========== 消除 ==========
    private checkMatches() {
        const visited = new Set<string>();
        let allMatch: { x: number, y: number }[] = [];

        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            for (let y = 0; y < GameConfig.BOARD_HEIGHT; y++) {
                const key = `${x},${y}`;
                if (visited.has(key) || !this.board[x][y]) continue;

                const blockType = (this.board[x][y] as any)._blockType;
                const connected: { x: number, y: number }[] = [];
                const queue: { x: number, y: number }[] = [{ x, y }];

                while (queue.length > 0) {
                    const cur = queue.shift()!;
                    const curKey = `${cur.x},${cur.y}`;
                    if (visited.has(curKey)) continue;
                    if (cur.x < 0 || cur.x >= GameConfig.BOARD_WIDTH) continue;
                    if (cur.y < 0 || cur.y >= GameConfig.BOARD_HEIGHT) continue;

                    const curBlock = this.board[cur.x][cur.y];
                    if (!curBlock || (curBlock as any)._blockType !== blockType) continue;

                    visited.add(curKey);
                    connected.push(cur);

                    queue.push({ x: cur.x - 1, y: cur.y });
                    queue.push({ x: cur.x + 1, y: cur.y });
                    queue.push({ x: cur.x, y: cur.y - 1 });
                    queue.push({ x: cur.x, y: cur.y + 1 });
                }

                if (connected.length >= GameConfig.MIN_MATCH) {
                    allMatch.push(...connected);
                }
            }
        }

        if (allMatch.length > 0) {
            this.eliminateBlocks(allMatch);
        }
    }

    private eliminateBlocks(blocks: { x: number, y: number }[]) {
        const dur = 0.3;

        for (const pos of blocks) {
            const block = this.board[pos.x][pos.y];
            if (!block) continue;

            tween(block)
                .to(dur, { scale: new Vec3(1.5, 1.5, 1) })
                .to(dur / 2, { opacity: 0 })
                .call(() => block.destroy())
                .start();

            this.board[pos.x][pos.y] = null;
        }

        const combo = blocks.length >= 6 ? ScoreConfig.COMBO_MULTI : 1;
        this.addScore(Math.floor(blocks.length * ScoreConfig.PER_BLOCK * combo));

        setTimeout(() => {
            this.applyGravity();
            setTimeout(() => this.checkMatches(), 400);
        }, dur * 1000);
    }

    // ========== 重力 ==========
    private applyGravity() {
        for (let x = 0; x < GameConfig.BOARD_WIDTH; x++) {
            let writeY = 0;
            for (let readY = 0; readY < GameConfig.BOARD_HEIGHT; readY++) {
                const block = this.board[x][readY];
                if (block) {
                    if (writeY !== readY) {
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
        this.node.emit('scoreChanged', this.score);
    }

    // ========== 游戏结束 ==========
    private checkGameOver(): boolean {
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
        for (const b of this.activeBlocks) b.destroy();
        this.activeBlocks = [];
        if (this.previewBlock) {
            this.previewBlock.destroy();
            this.previewBlock = null;
        }
    }

    // ========== 工具 ==========
    private getGridX(worldX: number): number {
        return Math.floor(
            (worldX + (GameConfig.BOARD_WIDTH * GameConfig.CELL_SIZE) / 2) / GameConfig.CELL_SIZE
        );
    }

    private getGridY(worldY: number): number {
        return Math.floor(
            (GameConfig.BOARD_OFFSET_Y + GameConfig.BOARD_HEIGHT * GameConfig.CELL_SIZE - worldY)
            / GameConfig.CELL_SIZE
        );
    }

    private gridToWorld(gridX: number, gridY: number): { x: number, y: number } {
        const x = - (GameConfig.BOARD_WIDTH * GameConfig.CELL_SIZE) / 2
            + gridX * GameConfig.CELL_SIZE + GameConfig.CELL_SIZE / 2;
        const y = GameConfig.BOARD_OFFSET_Y
            + GameConfig.BOARD_HEIGHT * GameConfig.CELL_SIZE
            - gridY * GameConfig.CELL_SIZE - GameConfig.CELL_SIZE / 2;
        return { x, y };
    }

    public getScore(): number {
        return this.score;
    }
}
