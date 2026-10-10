// 文字工具：处理文本对象的拆分等操作
// 依赖 arrange.jsx 里的 sciError 上报翻译键；ExtendScript 不加载界面语言包。

// 分隔符：全部 Unicode 空白（含窄/全角空格）、零宽字符与控制符。
// PDF 复制的文本里常见 \u2009 窄空格、\u200B 零宽空格、垂直制表符等。
function sciIsSplitSeparator(code) {
    if (code === 32 || code === 9) return true;
    if (code >= 0x1 && code <= 0x1f) return true; // 其余 C0 控制符（\r\n 已按行拆开）
    if (code === 0x7f || code === 0x85) return true; // DEL、NEL
    if (code === 0xa0 || code === 0x1680 || code === 0x202f) return true;
    if (code >= 0x2000 && code <= 0x200f) return true; // 各类空格 + 零宽字符
    if (code === 0x2028 || code === 0x2029) return true; // 行/段分隔符
    if (code === 0x205f || code === 0x2060 || code === 0x3000) return true;
    if (code === 0xfeff) return true;
    return false;
}

// 逐行提取非空片段，同时记录所在行与行内前缀，用于按原位置摆放
function sciCollectSplitTokens(contents) {
    var tokens = [];
    var lines = contents.split(/[\r\n]+/);
    for (var ln = 0; ln < lines.length; ln++) {
        var line = lines[ln];
        var i = 0;
        while (i < line.length) {
            while (i < line.length && sciIsSplitSeparator(line.charCodeAt(i))) i++;
            if (i >= line.length) break;
            var start = i;
            while (i < line.length && !sciIsSplitSeparator(line.charCodeAt(i))) i++;
            tokens.push({
                text: line.substring(start, i),
                line: ln,
                prefix: line.substring(0, start)
            });
        }
    }
    return tokens;
}

// 未知分隔符兜底：字符识别不出分隔符时，用临时副本逐字测量宽度，
// 按“明显大于字号/常规字宽的空隙”切分（仅点文本、单行）。
// PDF 导入的刻度标签常用生僻字符或纯定位产生空隙，字符层面无分隔可言。
function sciCollectGapTokens(frame, contents) {
    var text = String(contents);
    if (text.indexOf("\r") !== -1 || text.indexOf("\n") !== -1) return [];
    try {
        if (frame.kind !== TextType.POINTTEXT) return [];
    } catch (kindError) {
        return [];
    }
    if (text.length < 2) return [];

    var size = 10;
    try {
        size = frame.textRange.characterAttributes.size || 10;
    } catch (sizeError) {}

    var measure = frame.duplicate();
    var tokens = [];
    try {
        var advances = [],
            prevWidth = 0;
        for (var i = 0; i < text.length; i++) {
            measure.contents = text.substring(0, i + 1);
            var width = measure.width;
            advances.push(width - prevWidth);
            prevWidth = width;
        }
        var sorted = advances.slice(0).sort(function (a, b) {
            return a - b;
        });
        var median = sorted[Math.floor(sorted.length / 2)] || 0;
        // 空隙阈值取字号与常规字宽的高者，避免字距/宽字形（如 W）误切
        var threshold = Math.max(size * 0.9, median * 2.2);
        var start = 0,
            breaks = 0;
        for (var g = 0; g < text.length; g++) {
            if (advances[g] < threshold) continue;
            if (g + 1 >= text.length) break;
            var piece = text.substring(start, g);
            if (piece.length > 0) {
                tokens.push({
                    text: piece,
                    line: 0,
                    prefix: text.substring(0, start)
                });
                breaks++;
            }
            start = g + 1;
        }
        if (start < text.length)
            tokens.push({
                text: text.substring(start),
                line: 0,
                prefix: text.substring(0, start)
            });
        // 切得太碎说明是字距而非空隙，放弃兜底
        if (breaks === 0 || text.length / tokens.length < 2) return [];
    } finally {
        measure.remove();
    }
    return tokens;
}

// 把选中文本对象里以空白分隔的多段内容拆成独立文本对象。
// 保留原字体样式（duplicate 继承），按原文位置摆放，拆完选中新对象。
// 分隔符识别不出时退回视觉空隙切分。
function splitTextFrames() {
    if (app.documents.length === 0) return sciError("errors.noDocument");

    var doc = app.activeDocument;
    var selection = doc.selection;
    if (!selection || selection.length === 0)
        return sciError("errors.selectTextFrames");

    var frames = [];
    for (var i = 0; i < selection.length; i++) {
        if (selection[i].typename === "TextFrame") frames.push(selection[i]);
    }
    if (frames.length === 0) return sciError("errors.selectTextFrames");

    var created = [];
    var lastError = "";
    for (var f = 0; f < frames.length; f++) {
        try {
            var frame = frames[f];
            var contents = String(frame.contents);
            var tokens = sciCollectSplitTokens(contents);
            // 字符层面找不到分隔符时，按视觉空隙兜底切分
            if (tokens.length < 2) tokens = sciCollectGapTokens(frame, contents);
            // 既没有分隔符也没有可切空隙的文本对象保持原样
            if (tokens.length < 2) continue;

            var baseLeft = frame.left;
            var baseTop = frame.top;
            var isPointText = frame.kind === TextType.POINTTEXT;

            // 用一个临时副本测量行内前缀宽度与行高，保证与原文字体一致。
            // 点文本宽度随内容自适应；区域/路径文本测不了前缀，退化为行首堆叠。
            var measure = frame.duplicate();
            try {
                var lineHeight = 0;
                try {
                    measure.contents = "X";
                    var singleHeight = measure.height;
                    measure.contents = "X\rX";
                    lineHeight = measure.height - singleHeight;
                } catch (e) {}
                if (!(lineHeight > 0)) {
                    lineHeight =
                        frame.textRange.characterAttributes.size * 1.2;
                }

                for (var t = 0; t < tokens.length; t++) {
                    var token = tokens[t];
                    var piece = frame.duplicate();
                    piece.contents = token.text;
                    var dx = 0;
                    if (isPointText && token.prefix.length > 0) {
                        measure.contents = token.prefix;
                        dx = measure.width;
                    }
                    piece.left = baseLeft + dx;
                    piece.top = baseTop - token.line * lineHeight;
                    created.push(piece);
                }
            } finally {
                measure.remove();
            }
            frame.remove();
        } catch (e) {
            lastError = e.message || String(e);
        }
    }

    if (created.length === 0) {
        if (lastError) return sciError("errors.splitText", [lastError]);
        return sciError("errors.noSplittableText");
    }
    doc.selection = created;
    return String(created.length);
}

// 合并多个文本对象：按阅读顺序（先上后下、同行从左到右）拼成一个，
// 同行内容以空格连接，不同行换行；样式与位置取第一行最左的文本对象。
function mergeTextFrames() {
    if (app.documents.length === 0) return sciError("errors.noDocument");

    var doc = app.activeDocument;
    var selection = doc.selection;
    if (!selection || selection.length === 0)
        return sciError("errors.selectTextFrames");

    var decorated = [];
    for (var i = 0; i < selection.length; i++) {
        var frame = selection[i];
        if (frame.typename !== "TextFrame") continue;
        var top = 0, left = 0;
        try {
            top = frame.top;
            left = frame.left;
        } catch (e) {
            continue;
        }
        decorated.push({ frame: frame, top: top, left: left, index: decorated.length });
    }
    if (decorated.length < 2) return sciError("errors.nothingToMerge");

    // ExtendScript 排序不保证稳定，用 index 兜底
    decorated.sort(function (a, b) {
        return b.top - a.top || a.left - b.left || a.index - b.index;
    });

    // 同一基线的片段 top 差在容差内算一行；不同行远超行高的一半
    var ROW_TOLERANCE = 2;
    var rows = [],
        current = [decorated[0]],
        currentTop = decorated[0].top;
    for (var s = 1; s < decorated.length; s++) {
        if (currentTop - decorated[s].top > ROW_TOLERANCE) {
            rows.push(current);
            current = [];
            currentTop = decorated[s].top;
        }
        current.push(decorated[s]);
    }
    rows.push(current);
    for (var r = 0; r < rows.length; r++) {
        rows[r].sort(function (a, b) {
            return a.left - b.left || a.index - b.index;
        });
    }

    // 目标对象取第一行最左的，保留其样式与位置
    var target = rows[0][0].frame;
    var contents = "";
    for (var ln = 0; ln < rows.length; ln++) {
        for (var c = 0; c < rows[ln].length; c++) {
            var piece = String(rows[ln][c].frame.contents);
            if (contents === "") contents = piece;
            else if (c === 0) contents += "\r" + piece;
            else contents += " " + piece;
        }
    }
    try {
        target.contents = contents;
    } catch (e) {
        return sciError("errors.mergeText", [e.message || String(e)]);
    }

    var merged = 0;
    for (var d = 0; d < decorated.length; d++) {
        var source = decorated[d].frame;
        if (source === target) continue;
        try {
            source.remove();
            merged++;
        } catch (removeError) {}
    }
    doc.selection = [target];
    return String(merged + 1);
}
