/**
 * 《点击英雄》游戏入口文件
 * Clicker Heroes - Main Entry Point
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 《点击英雄》正在启动...');

    // 初始化游戏
    const game = new Game();

    // 启动游戏
    try {
        game.init();

        // 检查是否有存档，决定开始新游戏还是继续
        const hasSave = game.player && game.player.gold > 0;
        if (hasSave) {
            game.continueGame();
        } else {
            game.newGame();
        }

        console.log('✅ 游戏初始化完成！');
        console.log('💡 提示：点击怪物来造成伤害，获得金币后升级英雄！');
    } catch (error) {
        console.error('❌ 游戏初始化失败:', error);
    }

    // 暴露到全局（用于调试）
    window.game = game;
});

// 页面卸载前保存
document.addEventListener('beforeunload', () => {
    if (window.game && window.game.saveManager) {
        window.game.saveManager.save(window.game);
    }
});

// 处理页面可见性变化（切换标签页时暂停/恢复）
document.addEventListener('visibilitychange', () => {
    if (window.game && window.game.loop) {
        if (document.hidden) {
            window.game.loop.pause();
        } else {
            window.game.loop.resume();
        }
    }
});
