import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import { hostNamespace } from '../src/shared/host.ts';

const source = fs.readFileSync('dist/cep/jsx/index.js', 'utf8');

const text = () => ({ typename: 'TextFrame', selected: false });
const openPath = () => ({ typename: 'PathItem', closed: false, selected: false });
const closedPath = () => ({ typename: 'PathItem', closed: true, selected: false });
const compoundClosed = () => ({
  typename: 'CompoundPathItem',
  pathItems: [{ closed: true }, { closed: false }],
  selected: false
});
const compoundOpen = () => ({
  typename: 'CompoundPathItem',
  pathItems: [{ closed: false }],
  selected: false
});
const group = (children: any[]) => ({
  typename: 'GroupItem',
  pageItems: children,
  selected: false
});

function fixture(selection: any[]) {
  const document = { selection };
  const context = vm.createContext({
    $: {},
    app: { documents: [{}], activeDocument: document }
  });
  vm.runInContext(source, context);
  const call = (type: string) =>
    JSON.parse(
      context.$[hostNamespace].call(
        'filterSelection',
        encodeURIComponent(JSON.stringify([type]))
      )
    );
  return { document, call };
}

test('text filter keeps only text frames, one level into groups', () => {
  const inner = text();
  const shape = closedPath();
  const standalone = text();
  const { document, call } = fixture([group([inner, shape]), standalone]);

  const result = call('textOnly');
  assert.deepEqual(result, { ok: true, data: 'Success|2' });
  assert.equal(inner.selected, true);
  assert.equal(standalone.selected, true);
  assert.equal(shape.selected, false);
  assert.equal(document.selection, null);
});

test('path filter keeps open paths and all-open compound paths', () => {
  const line = openPath();
  const openCompound = compoundOpen();
  const { call } = fixture([line, openCompound, closedPath(), compoundClosed(), text()]);

  const result = call('pathsOnly');
  assert.deepEqual(result, { ok: true, data: 'Success|2' });
  assert.equal(line.selected, true);
  assert.equal(openCompound.selected, true);
});

test('shape filter keeps closed paths and compound paths with closed sub-paths', () => {
  const shape = closedPath();
  const closedCompound = compoundClosed();
  const innerShape = closedPath();
  const { call } = fixture([
    shape,
    closedCompound,
    openPath(),
    compoundOpen(),
    group([innerShape, text()])
  ]);

  const result = call('shapesOnly');
  assert.deepEqual(result, { ok: true, data: 'Success|3' });
  assert.equal(shape.selected, true);
  assert.equal(closedCompound.selected, true);
  assert.equal(innerShape.selected, true);
});

test('selection filters report dedicated errors when nothing matches', () => {
  assert.equal(fixture([text()]).call('pathsOnly').error, 'errors.noPaths');
  assert.equal(fixture([openPath()]).call('shapesOnly').error, 'errors.noShapes');
  assert.equal(fixture([openPath()]).call('textOnly').error, 'errors.noTextFrames');
});

test('selection filter validates selections and modes', () => {
  const { call } = fixture([]);
  assert.equal(call('textOnly').error, 'errors.selectObjects');
  assert.equal(fixture([text()]).call('diagonal').error, 'errors.unknownFilter');
});
