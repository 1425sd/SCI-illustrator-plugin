import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

// 与构建一致：sciError 定义在 arrange.jsx，textTools.jsx 与其共享同一作用域
const source =
  fs.readFileSync('src/jsx/ilst/arrange.jsx', 'utf8') +
  '\n' +
  fs.readFileSync('src/jsx/ilst/textTools.jsx', 'utf8');

const CHAR_W = 10;
const LINE_H = 12;

// 逐字宽度可控的点文本 mock：用于测试视觉空隙兜底
function gapFrame(
  doc: Record<string, unknown>,
  text: string,
  charWidths: Record<string, number>,
  left: number,
  top: number
) {
  const frame: Record<string, unknown> = {
    typename: 'TextFrame',
    kind: 'PointText',
    removed: false,
    _contents: text,
    _left: left,
    _top: top,
    textRange: { characterAttributes: { size: 10 } }
  };
  const widthOf = (value: string) => {
    let width = 0;
    for (const ch of value) width += charWidths[ch] ?? 0;
    return width;
  };
  Object.defineProperty(frame, 'contents', {
    get(this: any) {
      return this._contents;
    },
    set(this: any, value: string) {
      this._contents = value;
    }
  });
  Object.defineProperty(frame, 'left', {
    get(this: any) {
      return this._left;
    },
    set(this: any, value: number) {
      this._left = value;
    }
  });
  Object.defineProperty(frame, 'top', {
    get(this: any) {
      return this._top;
    },
    set(this: any, value: number) {
      this._top = value;
    }
  });
  Object.defineProperty(frame, 'width', {
    get(this: any) {
      return widthOf(String(this._contents));
    }
  });
  Object.defineProperty(frame, 'height', {
    get(this: any) {
      return LINE_H;
    }
  });
  frame.duplicate = () => {
    const copy = gapFrame(
      doc,
      frame._contents as string,
      charWidths,
      frame._left as number,
      frame._top as number
    );
    (doc.duplicates as unknown[]).push(copy);
    return copy;
  };
  frame.remove = () => {
    frame.removed = true;
    (doc.removed as unknown[]).push(frame);
  };
  return frame;
}

function makeFrame(
  doc: Record<string, unknown>,
  contents: string,
  left: number,
  top: number,
  kind = 'PointText'
) {
  const frame: Record<string, unknown> = {
    typename: 'TextFrame',
    kind,
    removed: false,
    _contents: contents,
    _left: left,
    _top: top,
    textRange: { characterAttributes: { size: 10 } }
  };
  Object.defineProperty(frame, 'contents', {
    get(this: any) {
      return this._contents;
    },
    set(this: any, value: string) {
      this._contents = value;
    }
  });
  Object.defineProperty(frame, 'left', {
    get(this: any) {
      return this._left;
    },
    set(this: any, value: number) {
      this._left = value;
    }
  });
  Object.defineProperty(frame, 'top', {
    get(this: any) {
      return this._top;
    },
    set(this: any, value: number) {
      this._top = value;
    }
  });
  Object.defineProperty(frame, 'width', {
    get(this: any) {
      const lines = String(this._contents).split(/[\r\n]+/);
      let widest = 0;
      for (const line of lines) widest = Math.max(widest, line.length * CHAR_W);
      return widest;
    }
  });
  Object.defineProperty(frame, 'height', {
    get(this: any) {
      const count = String(this._contents).split(/[\r\n]+/).length;
      return Math.max(1, count) * LINE_H;
    }
  });
  frame.duplicate = () => {
    const copy = makeFrame(
      doc,
      frame._contents as string,
      frame._left as number,
      frame._top as number,
      kind
    );
    (doc.duplicates as unknown[]).push(copy);
    return copy;
  };
  frame.remove = () => {
    frame.removed = true;
    (doc.removed as unknown[]).push(frame);
  };
  return frame;
}

function fixture(build: (doc: Record<string, unknown>) => unknown[]) {
  const doc: Record<string, unknown> = {
    duplicates: [],
    removed: []
  };
  doc.selection = build(doc);
  const context = vm.createContext({
    app: { documents: [doc], activeDocument: doc },
    TextType: { POINTTEXT: 'PointText', AREATEXT: 'AreaText', PATHTEXT: 'PathText' }
  });
  vm.runInContext(source, context);
  return {
    doc,
    split: () => String((context as any).splitTextFrames()),
    merge: () => String((context as any).mergeTextFrames())
  };
}

test('a space separated row splits into frames at their original positions', () => {
  let frame: any;
  const { doc, split } = fixture((doc) => {
    frame = makeFrame(doc, '1 2 3 4 5', 100, 200);
    return [frame];
  });
  assert.equal(split(), '5');
  assert.equal(frame.removed, true);
  const duplicates = doc.duplicates as any[];
  // 5 个结果 + 1 个测量用临时副本（最先创建）
  assert.equal(duplicates.length, 6);
  assert.equal(duplicates[0].removed, true, 'measurement clone is removed');
  const result = duplicates.filter((p) => !p.removed);
  // 帧对象带方法属性，deepEqual 不适用，按引用逐一比较
  assert.equal(
    (doc.selection as any[]).length,
    result.length,
    'split result should become the new selection'
  );
  (doc.selection as any[]).forEach((item, index) =>
    assert.equal(item, result[index])
  );
  assert.deepEqual(
    result.map((p) => p.contents),
    ['1', '2', '3', '4', '5']
  );
  assert.deepEqual(
    result.map((p) => [p.left, p.top]),
    [
      [100, 200],
      [120, 200],
      [140, 200],
      [160, 200],
      [180, 200]
    ]
  );
});

test('multi-line contents split per line with vertical offsets', () => {
  const { doc, split } = fixture((doc) => [makeFrame(doc, '1 2\r3 4', 50, 300)]);
  assert.equal(split(), '4');
  const result = (doc.duplicates as any[]).filter((p) => !p.removed);
  assert.deepEqual(
    result.map((p) => [p.contents, p.left, p.top]),
    [
      ['1', 50, 300],
      ['2', 70, 300],
      ['3', 50, 300 - LINE_H],
      ['4', 70, 300 - LINE_H]
    ]
  );
});

test('full-width, narrow and repeated spaces all count as separators', () => {
  const { doc, split } = fixture((doc) => [makeFrame(doc, '1　2\u20093   4', 0, 0)]);
  assert.equal(split(), '4');
  const result = (doc.duplicates as any[]).filter((p) => !p.removed);
  assert.deepEqual(
    result.map((p) => p.contents),
    ['1', '2', '3', '4']
  );
  assert.deepEqual(
    result.map((p) => p.left),
    [0, 20, 40, 80]
  );
});

test('zero-width and control characters count as separators', () => {
  const { doc, split } = fixture((doc) => [
    makeFrame(doc, '1\u200b2\u000b3', 0, 0)
  ]);
  assert.equal(split(), '3');
  const result = (doc.duplicates as any[]).filter((p) => !p.removed);
  assert.deepEqual(
    result.map((p) => p.contents),
    ['1', '2', '3']
  );
  assert.deepEqual(
    result.map((p) => p.left),
    [0, 20, 40]
  );
});

test('unrecognised separators fall back to splitting at wide visual gaps', () => {
  // \uE000 私有区字符不属于任何已知空白，模拟 PDF 刻度标签里的生僻分隔
  const text = '0.0\uE0000.5';
  const widths: Record<string, number> = { '0': 10, '.': 10, '\uE000': 30 };
  const { doc, split } = fixture((doc) => [gapFrame(doc, text, widths, 100, 200)]);
  assert.equal(split(), '2');
  const result = (doc.duplicates as any[]).filter((p) => !p.removed);
  assert.deepEqual(
    result.map((p) => [p.contents, p.left, p.top]),
    [
      ['0.0', 100, 200],
      // 第二段前缀 "0.0\uE000" = 10×3 + 30
      ['0.5', 160, 200]
    ]
  );
});

test('uniform tracking does not trigger the visual-gap fallback', () => {
  const text = 'abcdef';
  const widths: Record<string, number> = {};
  for (const ch of text) widths[ch] = 10;
  let frame: any;
  const { doc, split } = fixture((doc) => {
    frame = gapFrame(doc, text, widths, 0, 0);
    return [frame];
  });
  assert.equal(split(), 'Error: errors.noSplittableText');
  assert.equal(frame.removed, false);
});

test('multiple selected frames split in one pass and join the selection', () => {
  let a: any;
  let b: any;
  const { doc, split } = fixture((doc) => {
    a = makeFrame(doc, '1 2', 0, 10);
    b = makeFrame(doc, '3 4', 0, 50);
    return [a, b];
  });
  assert.equal(split(), '4');
  assert.equal(a.removed, true);
  assert.equal(b.removed, true);
  assert.equal((doc.removed as unknown[]).length, 4, 'two originals + two measurement clones');
  const result = (doc.duplicates as any[]).filter((p) => !p.removed);
  assert.deepEqual(
    result.map((p) => p.contents),
    ['1', '2', '3', '4']
  );
  assert.equal((doc.selection as any[]).length, result.length);
  (doc.selection as any[]).forEach((item, index) =>
    assert.equal(item, result[index])
  );
});

test('frames without separator content stay untouched', () => {
  let frame: any;
  const { doc, split } = fixture((doc) => {
    frame = makeFrame(doc, 'hello', 10, 10);
    return [frame];
  });
  assert.equal(split(), 'Error: errors.noSplittableText');
  assert.equal(frame.removed, false);
  // 空隙兜底的测量副本会被删除，不应有存活的新对象
  assert.equal(
    (doc.duplicates as any[]).filter((p) => !p.removed).length,
    0
  );
  assert.deepEqual(doc.selection, [frame]);
});

test('empty or non-text selections report errors without touching anything', () => {
  const empty = fixture(() => []);
  assert.equal(empty.split(), 'Error: errors.selectTextFrames');

  const path = { typename: 'PathItem' };
  const nonText = fixture(() => [path]);
  assert.equal(nonText.split(), 'Error: errors.selectTextFrames');
  assert.deepEqual(nonText.doc.selection, [path]);
});

test('same-row text frames merge in left-to-right order with spaces', () => {
  let first: any, second: any, third: any;
  const { doc, merge } = fixture((doc) => {
    third = makeFrame(doc, '3', 40, 100);
    first = makeFrame(doc, '1', 0, 100);
    second = makeFrame(doc, '2', 20, 100);
    return [third, first, second];
  });

  assert.equal(merge(), '3');
  assert.equal(first.contents, '1 2 3');
  assert.equal(first.left, 0);
  assert.equal(first.top, 100);
  assert.equal(second.removed, true);
  assert.equal(third.removed, true);
  // doc.selection 在 VM realm 内被重新赋值，deepEqual 过不了跨 realm 原型，按引用比较
  assert.equal(doc.selection.length, 1);
  assert.equal(doc.selection[0], first);
});

test('multi-row text frames merge with line breaks between rows', () => {
  let a: any, b: any, c: any, d: any;
  const { doc, merge } = fixture((doc) => {
    b = makeFrame(doc, '2', 20, 100);
    a = makeFrame(doc, '1', 0, 100);
    c = makeFrame(doc, '3', 0, 80);
    d = makeFrame(doc, '4', 20, 80);
    return [b, a, c, d];
  });

  assert.equal(merge(), '4');
  assert.equal(a.contents, '1 2\r3 4');
  assert.equal(a.left, 0);
  assert.equal(a.top, 100);
  assert.equal(doc.selection.length, 1);
  assert.equal(doc.selection[0], a);
});

test('merging fewer than two text frames reports an error', () => {
  const single = fixture((doc) => [makeFrame(doc, 'only', 0, 0)]);
  assert.equal(single.merge(), 'Error: errors.nothingToMerge');

  const withPath = fixture((doc) => [
    makeFrame(doc, 'only', 0, 0),
    { typename: 'PathItem' }
  ]);
  assert.equal(withPath.merge(), 'Error: errors.nothingToMerge');
});
