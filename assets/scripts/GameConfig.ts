/**
 * GameConfig.ts
 * 游戏全局配置与常量
 */

// 方块类型列表
export const BLOCK_TYPES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export type BlockType = string;

// 特殊方块(高级关卡用)
export const SPECIAL_BLOCKS = ['circle_red', 'diamond_blue', 'star_yellow', 'hex_green'] as const;

export const GameConfig = {
    // 游戏区域
    BOARD_WIDTH: 6,
    BOARD_HEIGHT: 12,
    CELL_SIZE: 56,
    BOARD_OFFSET_X: 0,
    BOARD_OFFSET_Y: 100,

    // 方块类型
    BLOCK_TYPES,
    SPECIAL_BLOCKS,

    // 消除规则
    MIN_MATCH: 3,

    // 物理参数
    DROP_SPEED: 800,

    // 危险线
    DANGER_LINE: 0.85,

    // UI位置
    PREVIEW_POS_Y: 500,
    DROP_POS_X: 0,
};

// 分数配置
export const ScoreConfig = {
    PER_BLOCK: 10,
    COMBO_MULTI: 1.5,
    LEVEL_BONUS: 100,
};

// 关卡配置
export const LevelConfig = [
    { id: 1, targetScore: 1000, blockTypes: 4, specialTypes: 0 },
    { id: 2, targetScore: 2000, blockTypes: 5, specialTypes: 0 },
    { id: 3, targetScore: 3500, blockTypes: 5, specialTypes: 1 },
    { id: 4, targetScore: 5000, blockTypes: 6, specialTypes: 1 },
    { id: 5, targetScore: 7000, blockTypes: 6, specialTypes: 2 },
];
