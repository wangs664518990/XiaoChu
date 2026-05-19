/**
 * GameManager.ts
 * 核心游戏逻辑管理器
 */

import { Node, Sprite, SpriteFrame, Vec3, tween, UIOpacity } from 'cc';
import { SingletonClass } from '../managers/SingletonClass';
import { EventName } from '../const/EventName';
import {
    BOARD_WIDTH, BOARD_HEIGHT, CELL_SIZE, BOARD_OFFSET_Y,
    MIN_MATCH, SCORE_PER_BLOCK, SCORE_COMBO_MULTI, COMBO_THRESHOLD,
    FALL_STEP, BLOCK_TYPES, ANIM_MERGE_DUR, ANIM_ELIMINATE_DUR, ANIM_GRAVITY_DUR
} from '../const/GameConfig';
import { App } from '../App';

export class GameManager extends SingletonClass<GameManager> {

    // ===== 棋盘数据 =====
    private board: (Node | null)[][] = [];

    // ===== 当前预览 =====
    private previewBlock: Node | null = null;
    private previewType: number = 0;

    // ===== 分数 =====
    private score: number = 0;
    private highScore: number = 0;

    // ===== 状态 =====
    private activeBlocks: Node[] = [];
    private isPlaying: boolean = false;

    // ===== 资源缓存 =====
    private blockFrames: Map<string, SpriteFrame> = new Map();

    // ===== 游戏根节点（GameView设置） =====
    private gameRoot: Node | null = null;

    protected onInit(): void {
        this.initBoard();
    }

    /**
     * 初始化（App调用）
     */
    public init(): void {
        this.preloadSprites();
    }

    /**
     * 设置游戏根节点（GameView调用）
     */
    public setGameRoot(root: Node): void {
        this.gameRoot = root;
    }

    // ===== 单例（静态入口）=====
    public static getInstance(): GameManager {
        return SingletonClass.getInstance<GameManager>(GameManager);
    }

    // ===== 棋盘 =====
    private initBoard(): void {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            this.board[x] = [];
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                this.board[x][y] = null;
            }
        }
    }

    // ===== 预加载精灵 =====
    private async preloadSprites(): Promise<void> {
        const allBlocks = [...BLOCK_TYPES];
        for (const blockType of allBlocks) {
            const path = `sprites/block_${blockType}`;
            const sf = await this.loadSF(path);
            if (sf) this.blockFrames.set(blockType, sf);
        }
    }

    private loadSF(path: string): Promise<SpriteFrame | null> {
        return new Promise((resolve) => {
            const { resources } = require('cc');
            resources.load(path, SpriteFrame, (err: any, asset: any) => {
                resolve(err ? null : asset);
            });
        });
    }

    // ===== 游戏控制 =====
    public startGame(): void {
        this.isPlaying = true;
        this.score = 0;
        this.clearBoard();
        App.event.emit(EventName.SCORE_UPDATE, 0);
        this.spawnPreview();
        App.event.emit(EventName.GAME_START);
        console.log('🎮 游戏开始！');
    }

    public pauseGame(): void {
        if (!this.isPlaying) return;
        this.isPlaying = false;
        App.event.emit(EventName.GAME_PAUSE);
    }

    public resumeGame(): void {
        if (this.isPlaying) return;
        this.isPlaying = true;
        App.event.emit(EventName.GAME_RESUME);
    }

    // ===== 预览方块 =====
    private spawnPreview(): void {
        const available = BLOCK_TYPES.slice(0, 4);
        this.previewType = Math.floor(Math.random() * available.length);
        const typeName = String(available[this.previewType]);

        if (this.previewBlock) this.previewBlock.destroy();

        const frame = this.blockFrames.get(typeName);
        if (!frame || !this.gameRoot) return;

        const node = new Node(typeName);
        node.addComponent(Sprite).spriteFrame = frame;
        node.parent = this.gameRoot;
        node.setPosition(0, 500, 0);
        this.previewBlock = node;
    }

    // ===== 下落 =====
    public dropBlock(worldX: number): void {
        if (!this.isPlaying || !this.previewBlock || !this.gameRoot) return;

        const frame = this.previewBlock.getComponent(Sprite)?.spriteFrame;
        const typeName = this.previewBlock.name;

        const block = new Node(typeName);
        block.addComponent(Sprite).spriteFrame = frame;
        block.parent = this.gameRoot;
        block.setPosition(worldX, 500, 0);

        (block as any)._blockType = typeName;
        this.activeBlocks.push(block);
        this.fallBlock(block, worldX);
    }

    private fallBlock(block: Node, startX: number): void {
        let currentY = 500;
        let landed = false;

        const fall = () => {
            if (!this.isPlaying || landed) return;
            currentY -= FALL_STEP;

            const gx = this.getGridX(block.position.x);
            const gy = this.getGridY(currentY);

            if (gy <= 0) {
                this.landBlock(block, gx, 0);
                landed = true; return;
            }

            if (gy > 0 && gy < BOARD_HEIGHT && this.board[gx][gy]) {
                this.landBlock(block, gx, gy + 1);
                landed = true; return;
            }

            block.setPosition(startX, currentY, 0);
            if (!landed) setTimeout(fall, 16);
        };

        fall();
    }

    private landBlock(block: Node, gx: number, gy: number): void {
        gx = Math.max(0, Math.min(BOARD_WIDTH - 1, gx));
        gy = Math.max(0, Math.min(BOARD_HEIGHT - 1, gy));

        const pos = this.gridToWorld(gx, gy);
        block.setPosition(pos.x, pos.y, 0);

        const idx = this.activeBlocks.indexOf(block);
        if (idx >= 0) this.activeBlocks.splice(idx, 1);

        const blockType = (block as any)._blockType;

        if (this.tryMerge(block, gx, gy, blockType)) return;

        this.board[gx][gy] = block;

        if (this.checkGameOver()) {
            this.gameOver(); return;
        }

        this.spawnPreview();
    }

    // ===== 合并 =====
    private tryMerge(_block: Node, gx: number, gy: number, type: string): boolean {
        const dirs = [
            { x: gx - 1, y: gy }, { x: gx + 1, y: gy },
            { x: gx, y: gy - 1 }, { x: gx, y: gy + 1 },
        ];

        for (const n of dirs) {
            if (n.x < 0 || n.x >= BOARD_WIDTH || n.y < 0 || n.y >= BOARD_HEIGHT) continue;
            const neighbor = this.board[n.x][n.y];
            if (neighbor && (neighbor as any)._blockType === type) {
                this.doMerge(gx, gy, n.x, n.y, type);
                return true;
            }
        }
        return false;
    }

    private doMerge(x1: number, y1: number, x2: number, y2: number, type: string): void {
        const b1 = this.board[x1][y1];
        const b2 = this.board[x2][y2];
        if (!b1 || !b2) return;

        const mid = this.gridToWorld((x1 + x2) / 2, (y1 + y2) / 2);
        const dur = ANIM_MERGE_DUR;

        tween(b1).to(dur, { position: new Vec3(mid.x, mid.y, 0) }).start();
        tween(b2).to(dur, { position: new Vec3(mid.x, mid.y, 0) }).start();

        setTimeout(() => {
            b1.destroy();
            b2.destroy();
            this.board[x1][y1] = null;
            this.board[x2][y2] = null;
            this.addScore(SCORE_PER_BLOCK * 2);
            App.event.emit(EventName.BLOCK_MERGED, type);
            this.checkMatches();
            this.spawnPreview();
        }, dur * 1000);
    }

    // ===== 消除 =====
    private checkMatches(): void {
        const visited = new Set<string>();
        let allMatch: { x: number, y: number }[] = [];

        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                const key = `${x},${y}`;
                if (visited.has(key) || !this.board[x][y]) continue;

                const type = (this.board[x][y] as any)._blockType;
                const connected: { x: number, y: number }[] = [];
                const queue: { x: number, y: number }[] = [{ x, y }];

                while (queue.length > 0) {
                    const cur = queue.shift()!;
                    const k = `${cur.x},${cur.y}`;
                    if (visited.has(k)) continue;
                    if (cur.x < 0 || cur.x >= BOARD_WIDTH || cur.y < 0 || cur.y >= BOARD_HEIGHT) continue;
                    const block = this.board[cur.x][cur.y];
                    if (!block || (block as any)._blockType !== type) continue;

                    visited.add(k);
                    connected.push(cur);
                    queue.push({ x: cur.x - 1, y: cur.y });
                    queue.push({ x: cur.x + 1, y: cur.y });
                    queue.push({ x: cur.x, y: cur.y - 1 });
                    queue.push({ x: cur.x, y: cur.y + 1 });
                }

                if (connected.length >= MIN_MATCH) {
                    allMatch.push(...connected);
                }
            }
        }

        if (allMatch.length > 0) this.eliminateBlocks(allMatch);
    }

    private eliminateBlocks(blocks: { x: number, y: number }[]): void {
        const dur = ANIM_ELIMINATE_DUR;

        for (const pos of blocks) {
            const block = this.board[pos.x][pos.y];
            if (!block) continue;

            const opacity = block.getComponent(UIOpacity) || block.addComponent(UIOpacity);
            tween(block)
                .to(dur, { scale: new Vec3(1.5, 1.5, 1) })
                .to(dur / 2, { scale: new Vec3(0, 0, 0) })
                .call(() => block.destroy())
                .start();

            this.board[pos.x][pos.y] = null;
            App.event.emit(EventName.BLOCK_ELIMINATED, pos.x, pos.y);
        }

        const combo = blocks.length >= COMBO_THRESHOLD ? SCORE_COMBO_MULTI : 1;
        this.addScore(Math.floor(blocks.length * SCORE_PER_BLOCK * combo));

        setTimeout(() => {
            this.applyGravity();
            setTimeout(() => this.checkMatches(), 400);
        }, dur * 1000);
    }

    // ===== 重力 =====
    private applyGravity(): void {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            let writeY = 0;
            for (let readY = 0; readY < BOARD_HEIGHT; readY++) {
                const block = this.board[x][readY];
                if (block) {
                    if (writeY !== readY) {
                        const newPos = this.gridToWorld(x, writeY);
                        tween(block).to(ANIM_GRAVITY_DUR, {
                            position: new Vec3(newPos.x, newPos.y, 0)
                        }).start();
                        this.board[x][writeY] = block;
                        this.board[x][readY] = null;
                    }
                    writeY++;
                }
            }
        }
    }

    // ===== 分数 =====
    private addScore(points: number): void {
        this.score += points;
        App.event.emit(EventName.SCORE_UPDATE, this.score);
        App.event.emit(EventName.SCORE_ADD, points);
    }

    // ===== 游戏结束 =====
    private checkGameOver(): boolean {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            if (this.board[x][BOARD_HEIGHT - 1]) return true;
        }
        return false;
    }

    private gameOver(): void {
        this.isPlaying = false;
        if (this.score > this.highScore) this.highScore = this.score;
        App.event.emit(EventName.GAME_OVER, this.score, this.highScore);
        console.log('💀 游戏结束！分数:', this.score);
    }

    private clearBoard(): void {
        for (let x = 0; x < BOARD_WIDTH; x++) {
            for (let y = 0; y < BOARD_HEIGHT; y++) {
                if (this.board[x][y]) { this.board[x][y].destroy(); this.board[x][y] = null; }
            }
        }
        for (const b of this.activeBlocks) b.destroy();
        this.activeBlocks = [];
        if (this.previewBlock) { this.previewBlock.destroy(); this.previewBlock = null; }
    }

    // ===== 工具 =====
    private getGridX(worldX: number): number {
        return Math.floor((worldX + (BOARD_WIDTH * CELL_SIZE) / 2) / CELL_SIZE);
    }

    private getGridY(worldY: number): number {
        return Math.floor((BOARD_OFFSET_Y + BOARD_HEIGHT * CELL_SIZE - worldY) / CELL_SIZE);
    }

    private gridToWorld(gx: number, gy: number): { x: number, y: number } {
        const x = -(BOARD_WIDTH * CELL_SIZE) / 2 + gx * CELL_SIZE + CELL_SIZE / 2;
        const y = BOARD_OFFSET_Y + BOARD_HEIGHT * CELL_SIZE - gy * CELL_SIZE - CELL_SIZE / 2;
        return { x, y };
    }

    // ===== 对外接口 =====
    public getScore(): number { return this.score; }
    public getHighScore(): number { return this.highScore; }
    public isRunning(): boolean { return this.isPlaying; }
}
