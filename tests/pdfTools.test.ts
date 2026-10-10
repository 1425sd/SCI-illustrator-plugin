import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { hostNamespace } from '../src/shared/host.ts';

const source = fs.readFileSync('dist/cep/jsx/index.js', 'utf8');
type Bounds = [number, number, number, number];

function attach(parent: any, child: any): any {
  child.parent = parent;
  child.remove = () => {
    const index = parent.pageItems.indexOf(child);
    if (index >= 0) parent.pageItems.splice(index, 1);
    child.parent = null;
  };
  parent.pageItems.push(child);
  return child;
}

function path(bounds: Bounds, overrides: Record<string, unknown> = {}): any {
  return {
    typename: 'PathItem',
    geometricBounds: [...bounds] as Bounds,
    visibleBounds: [...bounds] as Bounds,
    pathPoints: [{}, {}, {}, {}],
    filled: false,
    stroked: false,
    opacity: 100,
    tags: [],
    ...overrides
  };
}

function group(children: any[], overrides: Record<string, unknown> = {}): any {
  const value: any = {
    typename: 'GroupItem',
    pageItems: [],
    clipped: false,
    tags: [],
    ...overrides
  };
  for (const child of children) attach(value, child);
  value.remove = () => {
    value.parent = null;
  };
  return value;
}

function resizeable(
  bounds: Bounds,
  overrides: Record<string, unknown> = {}
): any {
  const value: any = path(bounds, overrides);
  value.resize = (scaleX: number, scaleY: number) => {
    const [left, top, right, bottom] = value.geometricBounds;
    const cx = (left + right) / 2;
    const cy = (top + bottom) / 2;
    const width = ((right - left) * scaleX) / 100;
    const height = ((top - bottom) * scaleY) / 100;
    value.geometricBounds = [
      cx - width / 2,
      cy + height / 2,
      cx + width / 2,
      cy - height / 2
    ];
    value.visibleBounds = [...value.geometricBounds];
  };
  return value;
}

function fixture(
  selection: any[],
  documents: any[] = [{}],
  appOverrides: Record<string, unknown> = {}
) {
  const document: any = { selection, pageItems: [] };
  for (const item of selection) {
    if (!item.parent) item.parent = document;
    if (!document.pageItems.includes(item)) document.pageItems.push(item);
  }
  const context = vm.createContext({
    $: {},
    app: { documents, activeDocument: document, ...appOverrides },
    Transformation: { CENTER: 'center' }
  });
  vm.runInContext(source, context);
  const call = (operation: string, args: unknown[] = []) =>
    JSON.parse(
      context.$[hostNamespace].call(
        operation,
        encodeURIComponent(JSON.stringify(args))
      )
    );
  return { document, call };
}

test('PDF cleanup removes empty and full-page white paths but preserves clipping and stroked artwork', () => {
  const background = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 },
    name: 'panel.background'
  });
  const empty = path([10, 90, 20, 80]);
  const clipping = path([0, 100, 100, 0], { clipping: true });
  const stroked = path([20, 80, 80, 20], { stroked: true, strokeWidth: 1 });
  const vertical = path([50, 80, 50, 20], { stroked: true, strokeWidth: 1 });
  const horizontal = path([20, 50, 80, 50], {
    stroked: true,
    strokeWidth: 1
  });
  const root = group([
    stroked,
    vertical,
    horizontal,
    clipping,
    empty,
    background
  ]);
  const { document, call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 1,
      removedPaths: 1,
      removedGroups: 0,
      backgroundSizes: ['35.3 × 35.3 mm'],
      selectionRoots: 1,
      scopeItems: 7
    })
  });
  assert.equal(root.pageItems.includes(background), false);
  assert.equal(root.pageItems.includes(empty), false);
  assert.equal(root.pageItems.includes(clipping), true);
  assert.equal(root.pageItems.includes(stroked), true);
  assert.equal(root.pageItems.includes(vertical), true);
  assert.equal(root.pageItems.includes(horizontal), true);
  assert.equal(document.selection.length, 1);
  assert.equal(document.selection[0], root);
});

test('PDF cleanup removes a white background matching a nested group bounds', () => {
  const nestedBackground = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const nestedArtwork = path([10, 90, 90, 10], {
    stroked: true,
    strokeWidth: 1
  });
  const nested = group([nestedArtwork, nestedBackground]);
  const outerArtwork = path([-20, 120, 120, -20], {
    stroked: true,
    strokeWidth: 1
  });
  const root = group([nested, outerArtwork]);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 1,
      removedPaths: 0,
      removedGroups: 0,
      backgroundSizes: ['35.3 × 35.3 mm'],
      selectionRoots: 1,
      scopeItems: 5
    })
  });
  assert.equal(nested.pageItems.includes(nestedBackground), false);
  assert.equal(nested.pageItems.includes(nestedArtwork), true);
  assert.equal(root.pageItems.includes(outerArtwork), true);
});

test('PDF cleanup removes nested white shapes anywhere in the tree', () => {
  const whiteShape = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const wrapper = group([whiteShape]);
  const outerArtwork = path([-20, 120, 120, -20], {
    stroked: true,
    strokeWidth: 1
  });
  const root = group([wrapper, outerArtwork]);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 1,
      removedPaths: 0,
      removedGroups: 1,
      backgroundSizes: ['35.3 × 35.3 mm'],
      selectionRoots: 1,
      scopeItems: 4
    })
  });
  assert.equal(wrapper.pageItems.includes(whiteShape), false);
  assert.equal(root.pageItems.includes(outerArtwork), true);
});

test('PDF cleanup keeps outlined white shapes such as box-plot boxes', () => {
  const outlinedBox = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 },
    stroked: true,
    strokeWidth: 1
  });
  const root = group([outlinedBox]);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 0,
      removedPaths: 0,
      removedGroups: 0,
      selectionRoots: 1,
      scopeItems: 2
    })
  });
  assert.equal(root.pageItems.includes(outlinedBox), true);
});

test('PDF cleanup removes white fills at the bottom of the z-order without bounds matching', () => {
  const artwork = path([0, 100, 100, 0], {
    stroked: true,
    strokeWidth: 1
  });
  const smallWhite = path([30, 70, 70, 30], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const root = group([artwork, smallWhite]);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.equal(result.ok, true);
  const info = JSON.parse((result as { data: string }).data);
  assert.equal(info.removedBackgrounds, 1);
  assert.equal(root.pageItems.includes(smallWhite), false);
  assert.equal(root.pageItems.includes(artwork), true);
});

test('PDF cleanup removes white fills at any stacking position', () => {
  const children: any[] = [
    path([30, 70, 70, 30], {
      filled: true,
      fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
    })
  ];
  for (let i = 0; i < 10; i++) {
    children.push(
      path([0, 100, 100, 0], { stroked: true, strokeWidth: 1 })
    );
  }
  const whiteTop = children[0];
  const root = group(children);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.equal(result.ok, true);
  const info = JSON.parse((result as { data: string }).data);
  assert.equal(info.removedBackgrounds, 1);
  assert.deepEqual(info.backgroundSizes, ['14.1 × 14.1 mm']);
  assert.equal(root.pageItems.includes(whiteTop), false);
  assert.equal(root.pageItems.length, 10);
});

test('PDF cleanup skips artwork under a locked ancestor instead of failing', () => {
  const lockedWhite = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const lockedMark = path([10, 90, 90, 10], {
    stroked: true,
    strokeWidth: 1
  });
  const locked = group([lockedMark, lockedWhite], { locked: true });
  const artwork = path([-20, 120, 120, -20], {
    stroked: true,
    strokeWidth: 1
  });
  const root = group([artwork, locked]);
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 0,
      removedPaths: 0,
      removedGroups: 0,
      selectionRoots: 1,
      scopeItems: 5
    })
  });
  assert.equal(locked.pageItems.includes(lockedWhite), true);
});

test('PDF cleanup continues remaining candidates after one removal fails', () => {
  const artwork = path([0, 100, 100, 0], {
    stroked: true,
    strokeWidth: 1
  });
  const stubborn = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const removable = path([0, 100, 100, 0], {
    filled: true,
    fillColor: { typename: 'RGBColor', red: 255, green: 255, blue: 255 }
  });
  const root = group([artwork, stubborn, removable]);
  stubborn.remove = () => {
    throw new Error('对象无效');
  };
  const { call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.equal(result.ok, true);
  const info = JSON.parse((result as { data: string }).data);
  assert.equal(info.removedBackgrounds, 1);
  assert.equal(root.pageItems.includes(stubborn), true);
  assert.equal(root.pageItems.includes(removable), false);
});

test('PDF cleanup removes a white rectangle exposed by a released mask', () => {
  const artwork = path([0, 100, 100, 0], { stroked: true, strokeWidth: 1 });
  const mask = path([0, 100, 100, 0], { clipping: true });
  const clipped = group([artwork, mask], { clipped: true });
  const root = group([clipped]);
  const { call } = fixture([root], [{}], {
    executeMenuCommand: (command: string) => {
      if (command === 'releaseMask') {
        clipped.clipped = false;
        mask.clipping = false;
        mask.filled = true;
        mask.fillColor = {
          typename: 'RGBColor',
          red: 255,
          green: 255,
          blue: 255
        };
      }
    }
  });

  const result = call('cleanupPdfSelection');
  assert.equal(result.ok, true);
  const info = JSON.parse((result as { data: string }).data);
  assert.equal(info.releasedMasks, 1);
  assert.equal(info.removedBackgrounds, 1);
  assert.deepEqual(info.backgroundSizes, ['35.3 × 35.3 mm']);
  assert.equal(clipped.pageItems.includes(mask), false);
  assert.equal(clipped.pageItems.includes(artwork), true);
});

test('menu commands are skipped when the selection cannot be set', () => {
  const artwork = path([0, 100, 100, 0], { stroked: true, strokeWidth: 1 });
  const mask = path([0, 100, 100, 0], { clipping: true });
  const clipped = group([artwork, mask], { clipped: true });
  const root = group([clipped]);
  let menuCalls = 0;
  const { document, call } = fixture([root], [{}], {
    executeMenuCommand: () => {
      menuCalls++;
    }
  });
  // 模拟隐藏/锁定父级下 doc.selection 赋值静默失败：
  // 入口读到的仍是原选区，但后续对内部组的赋值不再生效，
  // 菜单命令绝不能落到旧选区上
  Object.defineProperty(document, 'selection', {
    configurable: true,
    get() {
      return [root];
    },
    set() {}
  });

  const result = call('cleanupPdfSelection');
  assert.equal(result.ok, true);
  // 只有真实选中的根组允许执行菜单命令；内部组（如 clipped）一律跳过
  assert.equal(menuCalls, 1);
  const info = JSON.parse((result as { data: string }).data);
  assert.equal(info.releasedMasks, undefined);
  assert.equal(info.ungroupedGroups, 1);
  assert.equal(clipped.clipped, true);
});

test('image ratio changes use the requested anchor and preserve object centers', () => {
  const first = resizeable([0, 100, 40, 0]);
  const second = resizeable([100, 80, 160, 20]);
  const untouched = resizeable([200, 60, 240, 20]);
  const { document, call } = fixture([first, second]);
  document.pageItems = [first, second, untouched];

  assert.deepEqual(call('changeImageRatio', [2, 'height']), {
    ok: true,
    data: JSON.stringify({ changed: 2, ratio: 2, anchor: 'height' })
  });
  assert.deepEqual(first.geometricBounds, [-80, 100, 120, 0]);
  assert.deepEqual(second.geometricBounds, [70, 80, 190, 20]);
  assert.deepEqual(untouched.geometricBounds, [200, 60, 240, 20]);
  assert.equal(document.selection.length, 2);
  assert.equal(document.selection[0], first);
  assert.equal(document.selection[1], second);
});

test('image ratio can keep width and derive the target height', () => {
  const item = resizeable([0, 100, 80, 0]);
  const { call } = fixture([item]);

  assert.deepEqual(call('changeImageRatio', [2, 'width']), {
    ok: true,
    data: JSON.stringify({ changed: 1, ratio: 2, anchor: 'width' })
  });
  assert.deepEqual(item.geometricBounds, [0, 70, 80, 30]);
});

test('ratio change rejects text descendants before changing any object', () => {
  const image = resizeable([0, 100, 40, 0]);
  const text = {
    typename: 'TextFrame',
    geometricBounds: [5, 20, 20, 10] as Bounds
  };
  const root = group([image, text]);
  const { call } = fixture([root]);
  const before = [...image.geometricBounds];

  assert.equal(
    call('changeImageRatio', [2, 'height']).error,
    'errors.imageRatioText'
  );
  assert.deepEqual(image.geometricBounds, before);
});

test('selected text can be changed to 5 or 6 pt without changing the font', () => {
  const text = {
    typename: 'TextFrame',
    textRange: {
      characterAttributes: { size: 11, textFont: { name: 'ArialMT' } }
    },
    geometricBounds: [0, 20, 20, 0] as Bounds
  };
  const { document, call } = fixture([text]);

  assert.deepEqual(call('changeSelectedTextSize', [5]), {
    ok: true,
    data: JSON.stringify({ changed: 1, size: 5 })
  });
  assert.equal(text.textRange.characterAttributes.size, 5);
  assert.equal(text.textRange.characterAttributes.textFont.name, 'ArialMT');
  assert.equal(document.selection[0], text);
});

test('PDF operations validate documents, selections, ratios and anchors', () => {
  assert.equal(
    fixture([], []).call('cleanupPdfSelection').error,
    'errors.noDocument'
  );
  assert.equal(
    fixture([]).call('cleanupPdfSelection').error,
    'errors.pdfCleanupSelection'
  );
  assert.equal(
    fixture([resizeable([0, 10, 10, 0])]).call('changeImageRatio', [
      0,
      'height'
    ]).error,
    'errors.invalidImageRatio'
  );
  assert.equal(
    fixture([resizeable([0, 10, 10, 0])]).call('changeImageRatio', [
      1,
      'diagonal'
    ]).error,
    'errors.invalidRatioAnchor'
  );
  assert.equal(
    fixture([
      { typename: 'TextFrame', textRange: { characterAttributes: {} } }
    ]).call('changeSelectedTextSize', [7]).error,
    'errors.invalidTextSize'
  );
});
