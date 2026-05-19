/**
 * EventName.ts
 * 全局事件名常量
 */

export const EventName = {
    // ===== 游戏事件 =====
    GAME_START: 'game_start',
    GAME_OVER: 'game_over',
    GAME_PAUSE: 'game_pause',
    GAME_RESUME: 'game_resume',
    GAME_RESTART: 'game_restart',

    // ===== 分数事件 =====
    SCORE_UPDATE: 'score_update',
    SCORE_ADD: 'score_add',
    COMBO_UPDATE: 'combo_update',

    // ===== 方块事件 =====
    BLOCK_LANDED: 'block_landed',
    BLOCK_MERGED: 'block_merged',
    BLOCK_ELIMINATED: 'block_eliminated',
    BLOCK_FALLING: 'block_falling',
    CHAIN_REACTION: 'chain_reaction',

    // ===== UI事件 =====
    UI_SHOW_MENU: 'ui_show_menu',
    UI_SHOW_GAME: 'ui_show_game',
    UI_SHOW_RESULT: 'ui_show_result',
    UI_UPDATE_SCORE: 'ui_update_score',
    UI_SHOW_TIPS: 'ui_show_tips',
    UI_LEVEL_COMPLETE: 'ui_level_complete',

    // ===== 音频事件 =====
    SOUND_PLAY_EFFECT: 'sound_play_effect',
    SOUND_PLAY_BGM: 'sound_play_bgm',
    SOUND_STOP_BGM: 'sound_stop_bgm',

    // ===== 存储事件 =====
    DATA_LOADED: 'data_loaded',
    DATA_SAVE: 'data_save',
};
