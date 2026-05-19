/**
 * GameConfig.ts
 * 游戏全局配置与常量
 */

export const GameConfig = {
    // 游戏区域
    BOARD_WIDTH: 6,         // 横向格子数
    BOARD_HEIGHT: 12,       // 纵向格子数
    CELL_SIZE: 56,          // 每个格子大小(px)
    BOARD_OFFSET_X: 0,      // 棋盘X偏移(居中)
    BOARD_OFFSET_Y: 100,     // 棋盘Y偏移(顶部留空间)

    // 方块类型
    BLOCK_TYPES: [
        'red', 'orange', 'yellow', 'green', 'blue', 'purple'
    ] as const,
    type BlockType = typeof GameConfig.BLOCK_TYPES[number];

    // 特殊方块(高级关卡用)
    SPECIAL_BLOCKS: [
        'circle_red', 'diamond_blue', 'star_yellow', 'hex_green'
    ] as const,

    // 消除规则
    MIN_MATCH: 3,           // 最少3个相同才消除

    // 物理参数
    DROP_SPEED: 800,         // 方块下落速度(px/s)
    GRAVITY: 980,           // 重力加速度

    // 危险线位置(百分比)
    DANGER_LINE: 0.85,      // 85%高度为危险线

    // UI
    PREVIEW_POS_Y: 50,      // 预览方块Y位置
    DROP_POS_X: 0,          // 下落点X(居中)
    DROP_POS_Y: -50,        // 下落点Y(顶部)

    // 音效
    SOUND_MATCH: 'match',   // 消除音效
    SOUND_DROP: 'drop',     // 掉落音效
    SOUND_GAME_OVER: 'gameover', // 游戏结束音效

    // 场景路径
    MAIN_SCENE: 'MainScene',
    GAME_OVER_SCENE: 'GameOverScene',
};

// 分数配置
export const ScoreConfig = {
    PER_BLOCK: 10,          // 每个消除方块+10分
    COMBO_MULTI: 1.5,       // 连消倍率
    LEVEL_BONUS: 100,       // 过关额外奖励
};

// 关卡配置
export const LevelConfig = [
    { id: 1, targetScore: 1000, blockTypes: 4, specialTypes: 0 },
    { id: 2, targetScore: 2000, blockTypes: 5, specialTypes: 0 },
    { id: 3, targetScore: 3500, blockTypes: 5, specialTypes: 1 },
    { id: 4, targetScore: 5000, blockTypes: 6, specialTypes: 1 },
    { id: 5, targetScore: 7000, blockTypes: 6, specialTypes: 2 },
];
