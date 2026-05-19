/**
 * ViewName.ts
 * 视图名与预制体路径映射
 */

export const ViewName = {
    // ===== Single：同时只能存在一个 =====
    homeView: 'prefab/view/homeView',
    gameView: 'prefab/view/gameView',
    resultView: 'prefab/view/resultView',
    pauseView: 'prefab/view/pauseView',
    settingsView: 'prefab/view/settingsView',
    loadingView: 'prefab/view/loadingView',

    // ===== Multiple：可以多个同时存在 =====
    tipsView: 'prefab/common/tipsView',
};

// ===== 视图脚本映射 =====
export const ViewScript = {
    [ViewName.homeView]: 'games/views/HomeView',
    [ViewName.gameView]: 'games/views/GameView',
    [ViewName.resultView]: 'games/views/ResultView',
    [ViewName.pauseView]: 'games/views/PauseView',
    [ViewName.settingsView]: 'games/views/SettingsView',
    [ViewName.loadingView]: 'games/views/LoadingView',
    [ViewName.tipsView]: 'games/views/TipsView',
};
