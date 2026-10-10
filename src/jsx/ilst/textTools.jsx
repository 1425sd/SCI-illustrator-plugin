// 文字工具：处理文本对象的拆分等操作
// 依赖 arrange.jsx 里的 sciError 上报翻译键；ExtendScript 不加载界面语言包。

// 分隔符：空格、Tab、全角空格、不间断空格及各类 Unicode 空白
// （从 PDF 复制的文本常见 \u2009 等窄空格）
function sciIsSplitSeparator(code) {
    return code === 32 || code === 9 || code === 0xa0 || code === 0xfeff ||
        code === 0x3000 || code === 0x202f ||
        (code >= 0x2000 && code <= 0x200a);
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

// 把选中文本对象里以空白分隔的多段内容拆成独立文本对象。
// 保留原字体样式（duplicate 继承），按原文位置摆放，拆完选中新对象。
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
            var tokens = sciCollectSplitTokens(String(frame.contents));
            // 没有空白分隔内容的文本对象保持原样
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
