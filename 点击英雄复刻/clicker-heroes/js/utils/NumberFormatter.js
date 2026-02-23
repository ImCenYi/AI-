/**
 * NumberFormatter - 大数字格式化工具类
 * 用于将游戏中的大数字格式化为易读的字符串格式
 * 支持科学计数法、缩写格式（K/M/B/T等）
 */
class NumberFormatter {
    /**
     * 数字单位缩写表
     * 从千(K)开始，一直到极大的数字单位
     */
    static get UNITS() {
        return [
            '', 'K', 'M', 'B', 'T',           // 千、百万、十亿、万亿
            'Qa', 'Qi', 'Sx', 'Sp', 'Oc',      // 千万亿、百亿亿、十的21次方、十的24次方、十的27次方
            'No', 'Dc', 'UDc', 'DDc', 'TDc',   // 十的30次方到十的42次方
            'QaDc', 'QiDc', 'SxDc', 'SpDc', 'ODc', // 十的45次方到十的57次方
            'Nv', 'Vg', 'UVg', 'DVg', 'TVg',   // 十的60次方到十的72次方
            'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OVg', // 十的75次方到十的87次方
            'Ng', 'Ug', 'Dug', 'Tg', 'Qag',    // 十的90次方到十的102次方
            'Qig', 'Sxg', 'Spg', 'Ocg', 'Nog', // 十的105次方到十的117次方
            'C', 'Uc'                          // 十的120次方及以上
        ];
    }

    /**
     * 格式化数字为完整字符串（带单位缩写）
     * @param {number} num - 要格式化的数字
     * @param {number} decimals - 小数位数（默认2位）
     * @returns {string} 格式化后的字符串
     * 
     * 示例:
     * - 1000 -> "1.00K"
     * - 1500000 -> "1.50M"
     * - 0.5 -> "0.50"
     */
    static format(num, decimals = 2) {
        // 处理无效输入
        if (num === null || num === undefined || isNaN(num)) {
            return '0';
        }

        // 处理负数
        if (num < 0) {
            return '-' + this.format(-num, decimals);
        }

        // 处理极小数字
        if (num < 1) {
            return num.toFixed(decimals);
        }

        // 计算数字的位数
        const digitCount = Math.floor(Math.log10(num)) + 1;
        
        // 如果数字小于1000，直接返回
        if (digitCount < 4) {
            return num.toFixed(decimals).replace(/\.?0+$/, '');
        }

        // 计算单位索引（每3位一个单位）
        const unitIndex = Math.floor((digitCount - 1) / 3);
        
        // 如果超出单位表范围，使用科学计数法
        if (unitIndex >= this.UNITS.length) {
            return num.toExponential(decimals);
        }

        // 计算显示数值
        const divisor = Math.pow(1000, unitIndex);
        const displayValue = num / divisor;

        // 格式化输出
        return displayValue.toFixed(decimals).replace(/\.?0+$/, '') + this.UNITS[unitIndex];
    }

    /**
     * 紧凑格式化（更少的小数位）
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的紧凑字符串
     * 
     * 示例:
     * - 1234 -> "1.2K"
     * - 1234567 -> "1.2M"
     */
    static formatCompact(num) {
        return this.format(num, 1);
    }

    /**
     * 整数格式化（无小数位）
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的整数字符串
     */
    static formatInteger(num) {
        return this.format(num, 0);
    }

    /**
     * 精确格式化（更多小数位）
     * @param {number} num - 要格式化的数字
     * @returns {string} 格式化后的精确字符串
     */
    static formatPrecise(num) {
        return this.format(num, 3);
    }

    /**
     * 格式化百分比
     * @param {number} num - 要格式化的数字（0-1之间）
     * @param {number} decimals - 小数位数（默认1位）
     * @returns {string} 格式化后的百分比字符串
     * 
     * 示例:
     * - 0.1234 -> "12.3%"
     * - 1.5 -> "150.0%"
     */
    static formatPercent(num, decimals = 1) {
        return (num * 100).toFixed(decimals) + '%';
    }

    /**
     * 格式化时间（秒转为可读格式）
     * @param {number} seconds - 秒数
     * @returns {string} 格式化后的时间字符串
     * 
     * 示例:
     * - 30 -> "30s"
     * - 90 -> "1m 30s"
     * - 3665 -> "1h 1m 5s"
     */
    static formatTime(seconds) {
        if (seconds < 60) {
            return Math.floor(seconds) + 's';
        }
        
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        }
        return `${minutes}m ${secs}s`;
    }

    /**
     * 格式化DPS（每秒伤害）
     * @param {number} dps - DPS数值
     * @returns {string} 格式化后的DPS字符串
     */
    static formatDPS(dps) {
        return this.format(dps, 1) + ' DPS';
    }

    /**
     * 解析格式化后的字符串为数字
     * @param {string} str - 格式化后的字符串
     * @returns {number} 解析后的数字
     */
    static parse(str) {
        if (typeof str !== 'string') {
            return parseFloat(str) || 0;
        }

        // 移除空格
        str = str.trim();

        // 查找单位
        const unitMatch = str.match(/[a-zA-Z]+$/);
        if (!unitMatch) {
            return parseFloat(str) || 0;
        }

        const unit = unitMatch[0];
        const value = parseFloat(str.replace(unit, ''));
        
        if (isNaN(value)) return 0;

        // 查找单位对应的指数
        const unitIndex = this.UNITS.indexOf(unit);
        if (unitIndex === -1) {
            return value;
        }

        return value * Math.pow(1000, unitIndex);
    }
}

// 导出模块（支持ES6模块和CommonJS）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NumberFormatter;
}
