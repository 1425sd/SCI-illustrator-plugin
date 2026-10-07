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

function fixture(selection: any[], documents: any[] = [{}]) {
  const document: any = { selection, pageItems: [] };
  for (const item of selection) {
    if (!item.parent) item.parent = document;
    if (!document.pageItems.includes(item)) document.pageItems.push(item);
  }
  const context = vm.createContext({
    $: {},
    app: { documents, activeDocument: document },
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
  const root = group([stroked, clipping, empty, background]);
  const { document, call } = fixture([root]);

  const result = call('cleanupPdfSelection');
  assert.deepEqual(result, {
    ok: true,
    data: JSON.stringify({
      removedBackgrounds: 1,
      removedPaths: 1,
      removedGroups: 0
    })
  });
  assert.equal(root.pageItems.includes(background), false);
  assert.equal(root.pageItems.includes(empty), false);
  assert.equal(root.pageItems.includes(clipping), true);
  assert.equal(root.pageItems.includes(stroked), true);
  assert.equal(document.selection.length, 1);
  assert.equal(document.selection[0], root);
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
