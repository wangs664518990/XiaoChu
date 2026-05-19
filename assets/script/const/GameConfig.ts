/**
 * GameConfig.ts
 * 游戏配置常量
 */

// ===== 方块类型 =====
export const BLOCK_TYPES = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'] as const;
export const SPECIAL_BLOCKS = ['circle_red', 'diamond_blue', 'star_yellow', 'hex_green'] as const;

// ===== 棋盘配置 =====
export const BOARD_WIDTH = 6;
export const BOARD_HEIGHT = 12;
export const CELL_SIZE = 56;

// ===== 游戏区域 =====
export const BOARD_OFFSET_X = 0;
export const BOARD_OFFSET_Y = 100;

// ===== 消除规则 =====
export const MIN_MATCH = 3;           // 最少3个相同才消除
export const CHAIN_DELAY = 400;      // 连锁反应延迟(ms)

// ===== 物理参数 =====
export const DROP_SPEED = 800;        // 方块下落速度(px/s)
export const FALL_STEP = 8;          // 每帧下落像素

// ===== UI位置 =====
export const PREVIEW_POS_Y = 500;
export const DROP_POS_X = 0;
export const DANGER_LINE = 0.85;

// ===== 分数 =====
export const SCORE_PER_BLOCK = 10;
export const SCORE_COMBO_MULTI = 1.5;
export const SCORE_LEVEL_BONUS = 100;
export const COMBO_THRESHOLD = 6;    // 6个以上触发连消倍率

// ===== 动画时长 =====
export const ANIM_MERGE_DUR = 0.2;
export const ANIM_ELIMINATE_DUR = 0.3;
export const ANIM_GRAVITY_DUR = 0.15;

// ===== 关卡 =====
export const LEVEL_CONFIG = [
    { id: 1, targetScore: 1000,  blockTypes: 4, specialTypes: 0 },
    { id: 2, targetScore: 2000,  blockTypes: 5, specialTypes: 0 },
    { id: 3, targetScore: 3500,  blockTypes: 5, specialTypes: 1 },
    { id: 4, targetScore: 5000,  blockTypes: 6, specialTypes: 1 },
    { id: 5, targetScore: 7000,  blockTypes: 6, specialTypes: 2 },
];

// ===== 音效 =====
export const SOUND = {
    BGM: 'audio/bgm',
    DROP: 'audio/drop',
    MERGE: 'audio/merge',
    ELIMINATE: 'audio/eliminate',
    GAME_OVER: 'audio/gameover',
    CLICK: 'audio/click',
    COMBO: 'audio/combo',
};

// ===== 存储Key =====
export const STORAGE_KEY = {
    HIGH_SCORE: 'highScore',
    LEVEL_DATA: 'levelData',
    SETTINGS: 'gameSettings',
    MUSIC_ON: 'musicOn',
    SFX_ON: 'sfxOn',
};
