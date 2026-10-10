// PDF cleanup and non-text image ratio tools.
// Keep this file ES3-compatible; it is concatenated into the private host scope.

// White page backgrounds sit at the bottom of a panel's z-order; this many
// bottommost siblings of a selected root are searched for them.
var PDF_BACKGROUND_Z_TAIL = 10;

// The report lists at most this many removed background sizes.
var PDF_BACKGROUND_SIZE_LIMIT = 10;

function pdfHasSciTag(item) {
  try {
    if (!item.tags) return false;
    for (var i = 0; i < item.tags.length; i++) {
      if (String(item.tags[i].name).indexOf('SCI_') === 0) return true;
    }
  } catch (e) {}
  return false;
}

// An item's own flags say nothing about its containers: PDF imports often
// lock or hide a wrapper group or layer, and Illustrator then refuses
// remove() with error 1346 ("对象无效") even though the item itself looks
// editable.
function pdfAncestorBlocksEdit(item) {
  try {
    var node = item.parent;
    while (node) {
      var type = '';
      try {
        type = node.typename;
      } catch (typeError) {
        return true;
      }
      if (!type || type === 'Document') return false;
      if (node.locked) return true;
      if (type === 'Layer' && node.visible === false) return true;
      node = node.parent;
    }
  } catch (e) {
    return true;
  }
  return false;
}

function pdfIsProtected(item) {
  try {
    if (item.clipping || item.guides || item.hidden || item.locked) return true;
  } catch (e) {}
  if (pdfAncestorBlocksEdit(item)) return true;
  return pdfHasSciTag(item);
}

function pdfChildren(item) {
  try {
    if (item.pageItems) return item.pageItems;
  } catch (e) {}
  return null;
}

function pdfChildrenArray(item) {
  var children = pdfChildren(item),
    result = [];
  if (!children) return result;
  try {
    for (var i = 0; i < children.length; i++) result.push(children[i]);
  } catch (e) {}
  return result;
}

function pdfPushUnique(items, item) {
  if (!item) return;
  for (var i = 0; i < items.length; i++) if (items[i] === item) return;
  items.push(item);
}

function pdfCollectItems(item, result) {
  if (!item) return;
  pdfPushUnique(result, item);
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++)
    pdfCollectItems(children[i], result);
}

function pdfCollectGroups(item, result, depth) {
  if (!item) return;
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++)
    pdfCollectGroups(children[i], result, depth + 1);
  try {
    if (item.typename === 'GroupItem')
      result.push({ item: item, depth: depth });
  } catch (e) {}
}

function pdfHasClippingChild(item) {
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++) {
    var child = children[i];
    try {
      if (child.clipping) return true;
      if (
        child.typename === 'CompoundPathItem' &&
        child.pathItems &&
        child.pathItems.length
      ) {
        for (var p = 0; p < child.pathItems.length; p++)
          if (child.pathItems[p].clipping) return true;
      }
    } catch (e) {}
  }
  return false;
}

function pdfIsClippingGroup(item) {
  try {
    return (
      item.typename === 'GroupItem' &&
      (!!item.clipped || pdfHasClippingChild(item))
    );
  } catch (e) {
    return false;
  }
}

function pdfCanEdit(item) {
  try {
    if (item.hidden || item.locked || pdfHasSciTag(item)) return false;
  } catch (e) {
    return false;
  }
  return !pdfAncestorBlocksEdit(item);
}

function pdfRunMenuOnItem(doc, item, command) {
  try {
    if (!app.executeMenuCommand || !pdfStillInDocument(item)) return false;
    doc.selection = [item];
    // 读回确认：隐藏/锁定父级会让赋值静默失败，菜单命令会作用到
    // 上一次的选区上，可能波及选区之外的对象。
    var current = doc.selection;
    if (!current || current.length !== 1 || current[0] !== item)
      return false;
    app.executeMenuCommand(command);
    return true;
  } catch (e) {
    return false;
  }
}

function pdfArialFontName(item) {
  var name = '';
  try {
    name = String(item.textRange.characterAttributes.textFont.name || '');
  } catch (e) {}
  var bold = /bold/i.test(name),
    italic = /italic|oblique/i.test(name),
    names = [];
  if (bold && italic) names.push('Arial-BoldItalicMT');
  if (bold) names.push('Arial-BoldMT');
  if (italic) names.push('Arial-ItalicMT');
  names.push('ArialMT');
  for (var i = 0; i < names.length; i++) {
    try {
      return app.textFonts.getByName(names[i]);
    } catch (fontError) {}
  }
  try {
    return app.textFonts.getByName('Arial');
  } catch (fallbackError) {
    return null;
  }
}

function pdfApplyArial(item, stats) {
  if (!item || !pdfCanEdit(item)) return;
  try {
    if (item.typename === 'TextFrame') {
      var font = pdfArialFontName(item);
      if (font) {
        item.textRange.characterAttributes.textFont = font;
        stats.changedFonts++;
      }
    }
  } catch (e) {}
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++) pdfApplyArial(children[i], stats);
}

function pdfEmbedItems(items, stats) {
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    if (!pdfCanEdit(item)) continue;
    try {
      if (item.typename === 'PlacedItem' && typeof item.embed === 'function') {
        item.embed();
        stats.embeddedImages++;
      }
    } catch (e) {}
  }
}

function pdfReleaseMasks(doc, roots, stats, existingGroups) {
  var groups = existingGroups || [];
  if (!existingGroups)
    for (var i = 0; i < roots.length; i++)
      pdfCollectGroups(roots[i], groups, 0);
  groups.sort(function (a, b) {
    return b.depth - a.depth;
  });
  for (var g = 0; g < groups.length; g++) {
    var group = groups[g].item;
    if (!pdfIsClippingGroup(group) || !pdfCanEdit(group)) continue;
    if (pdfRunMenuOnItem(doc, group, 'releaseMask')) stats.releasedMasks++;
  }
}

function pdfUngroup(doc, roots, stats, existingGroups) {
  var groups = existingGroups || [];
  if (!existingGroups)
    for (var i = 0; i < roots.length; i++)
      pdfCollectGroups(roots[i], groups, 0);
  groups.sort(function (a, b) {
    return b.depth - a.depth;
  });
  for (var g = 0; g < groups.length; g++) {
    var group = groups[g].item;
    if (!pdfCanEdit(group)) continue;
    if (pdfRunMenuOnItem(doc, group, 'ungroup')) stats.ungroupedGroups++;
  }
}

function pdfBounds(item) {
  try {
    var visible = getVisibleBounds(item);
    if (visible) return visible;
  } catch (e) {}
  try {
    if (item.visibleBounds) return item.visibleBounds;
  } catch (e2) {}
  try {
    return item.geometricBounds;
  } catch (e3) {
    return null;
  }
}

function pdfBoundsSize(bounds) {
  if (!bounds || bounds.length < 4) return null;
  var width = Math.abs(Number(bounds[2]) - Number(bounds[0]));
  var height = Math.abs(Number(bounds[1]) - Number(bounds[3]));
  if (!isFinite(width) || !isFinite(height)) return null;
  return { width: width, height: height };
}

function pdfBoundsMatch(a, b) {
  var as = pdfBoundsSize(a),
    bs = pdfBoundsSize(b);
  if (!as || !bs) return false;
  var tolerance = Math.max(
    0.5,
    Math.max(as.width, as.height, bs.width, bs.height) * 0.005
  );
  return (
    Math.abs(Number(a[0]) - Number(b[0])) <= tolerance &&
    Math.abs(Number(a[1]) - Number(b[1])) <= tolerance &&
    Math.abs(Number(a[2]) - Number(b[2])) <= tolerance &&
    Math.abs(Number(a[3]) - Number(b[3])) <= tolerance
  );
}

function pdfIsBottommost(item) {
  try {
    var parent = item.parent;
    if (parent && parent.pageItems && parent.pageItems.length) {
      if (parent.pageItems[parent.pageItems.length - 1] === item) return true;
      if (typeof item.zOrderPosition === 'number') {
        return (
          item.zOrderPosition === parent.pageItems.length - 1 ||
          item.zOrderPosition === parent.pageItems.length
        );
      }
      return false;
    }
  } catch (e) {}
  return true;
}

function pdfHasBackgroundName(item) {
  try {
    var name = String(item.name || '');
    return (
      /(^|[._ -])(background|bg)([._ -]|$)/i.test(name) ||
      /background/i.test(name)
    );
  } catch (e) {
    return false;
  }
}

function pdfIsWhiteColor(color) {
  if (!color) return false;
  try {
    if (color.typename === 'RGBColor')
      return color.red >= 250 && color.green >= 250 && color.blue >= 250;
    if (color.typename === 'GrayColor') return color.gray <= 2;
    if (color.typename === 'CMYKColor')
      return (
        color.cyan <= 3 &&
        color.magenta <= 3 &&
        color.yellow <= 3 &&
        color.black <= 3
      );
    if (color.typename === 'SpotColor' && color.spot)
      return pdfIsWhiteColor(color.spot.color);
  } catch (e) {}
  return false;
}

function pdfIsOpaque(item) {
  try {
    if (typeof item.opacity === 'number' && item.opacity < 99.5) return false;
  } catch (e) {}
  return true;
}

function pdfIsSolidFilled(item) {
  try {
    if (!item.filled || item.stroked) return false;
    if (!pdfIsOpaque(item)) return false;
    var color = item.fillColor;
    if (
      !color ||
      color.typename === 'GradientColor' ||
      color.typename === 'PatternColor'
    )
      return false;
    return pdfIsWhiteColor(color);
  } catch (e) {
    return false;
  }
}

// A PDF may wrap a panel in several groups.  A background can therefore
// match either the selected root bounds or the visible bounds of its own
// immediate container.  The latter is what lets us remove nested white
// panels without treating every white shape in the figure as a background.
function pdfMatchesBackgroundBounds(item, rootBounds) {
  var itemBounds = pdfBounds(item);
  if (!itemBounds) return false;
  if (rootBounds && pdfBoundsMatch(itemBounds, rootBounds)) return true;
  try {
    var parent = item.parent;
    // A wrapper containing only one white shape is not enough evidence: it
    // may simply be a white symbol or data mark.  Local-background matching
    // requires the surrounding group to contain other artwork as well.
    if (
      !parent ||
      parent.typename !== 'GroupItem' ||
      !parent.pageItems ||
      parent.pageItems.length < 2
    )
      return false;
    var parentBounds = pdfBounds(parent);
    return !!parentBounds && pdfBoundsMatch(itemBounds, parentBounds);
  } catch (e) {
    return false;
  }
}

function pdfCompoundIsBackground(item) {
  try {
    if (!item.pathItems || !item.pathItems.length) return false;
    var hasPaintedPath = false;
    for (var i = 0; i < item.pathItems.length; i++) {
      var path = item.pathItems[i];
      if (path.clipping || !pdfIsSolidFilled(path)) return false;
      hasPaintedPath = true;
    }
    return hasPaintedPath;
  } catch (e) {
    return false;
  }
}

function pdfIsBackground(item, rootBounds) {
  if (pdfIsProtected(item) || !rootBounds || !pdfIsBottommost(item))
    return false;
  var isPath = false;
  try {
    isPath =
      item.typename === 'PathItem' || item.typename === 'CompoundPathItem';
  } catch (e) {}
  if (!isPath || !pdfMatchesBackgroundBounds(item, rootBounds)) return false;
  var solid =
    item.typename === 'PathItem'
      ? pdfIsSolidFilled(item)
      : pdfCompoundIsBackground(item);
  if (!solid && !pdfHasBackgroundName(item)) return false;
  try {
    if (item.stroked) return false;
  } catch (e2) {}
  return true;
}

// The bounds-matching rules above stay conservative on purpose.  Real PDF
// panels also stack plain white rectangles at the bottom of the z-order, so
// any white-filled, unstroked path among the bottommost siblings of a
// selected root counts as a background even when its bounds match nothing.
function pdfCollectZTailBackgrounds(root, candidates) {
  var children = pdfChildrenArray(root);
  var first =
    children.length > PDF_BACKGROUND_Z_TAIL
      ? children.length - PDF_BACKGROUND_Z_TAIL
      : 0;
  for (var i = children.length - 1; i >= first; i--) {
    var item = children[i];
    if (pdfIsProtected(item)) continue;
    var solid = false;
    try {
      if (item.stroked) continue;
      if (item.typename === 'PathItem') solid = pdfIsSolidFilled(item);
      else if (item.typename === 'CompoundPathItem')
        solid = pdfCompoundIsBackground(item);
    } catch (tailError) {
      continue;
    }
    if (!solid) continue;
    var duplicate = false;
    for (var c = 0; c < candidates.length; c++) {
      if (candidates[c].item === item) {
        duplicate = true;
        break;
      }
    }
    if (!duplicate)
      candidates.push({ item: item, kind: 'background', depth: 1 });
  }
}

// Removed backgrounds are summarised by size (mm) so the report says what
// was actually deleted.
function pdfDescribeBackground(item) {
  var size = pdfBoundsSize(pdfBounds(item));
  if (!size) return '';
  var width = Math.round(pointsToMm(size.width) * 10) / 10;
  var height = Math.round(pointsToMm(size.height) * 10) / 10;
  return width + ' \u00d7 ' + height + ' mm';
}

// 删除候选必须是所选根组的后代：取消编组会改变对象的父级，
// 这里沿 parent 链向上找所选根组，越界对象一律不碰。
function pdfIsInsideRoots(item, roots) {
  try {
    var node = item;
    while (node) {
      for (var r = 0; r < roots.length; r++)
        if (roots[r] === node) return true;
      var type = '';
      try {
        type = node.typename;
      } catch (typeError) {
        return false;
      }
      if (!type || type === 'Document' || type === 'Layer') return false;
      node = node.parent;
    }
  } catch (e) {}
  return false;
}

// Removing candidates is one shared routine: skip stale references and
// anything outside the selected roots, record background sizes before the
// object disappears, and let a failed remove() (locked ancestor, ExtendScript
// error 1346) only disqualify that one item.
function pdfRemoveCandidates(candidates, outcome, roots) {
  for (var c = 0; c < candidates.length; c++) {
    var candidate = candidates[c];
    if (!pdfStillInDocument(candidate.item)) continue;
    if (roots && !pdfIsInsideRoots(candidate.item, roots)) continue;
    var size =
      candidate.kind === 'background'
        ? pdfDescribeBackground(candidate.item)
        : '';
    try {
      candidate.item.remove();
    } catch (candidateError) {
      continue;
    }
    if (candidate.kind === 'background') {
      outcome.removedBackgrounds++;
      if (size && outcome.sizes.length < PDF_BACKGROUND_SIZE_LIMIT)
        outcome.sizes.push(size);
    } else {
      outcome.removedPaths++;
    }
  }
}

// Releasing masks and ungrouping exposes paths the first pass never judged,
// a released white clipping rectangle first and foremost.  Re-run the same
// conservative background rules over the surviving roots and drop what they
// now flag, so the cleanup leaves no newly exposed white rectangles behind.
function pdfSecondPassBackgrounds(roots, outcome) {
  var candidates = [],
    groups = [];
  for (var r = 0; r < roots.length; r++) {
    var root = roots[r];
    if (!pdfStillInDocument(root)) continue;
    try {
      pdfVisitCleanup(root, pdfBounds(root), true, 0, candidates, groups);
      pdfCollectZTailBackgrounds(root, candidates);
    } catch (visitError) {
      continue;
    }
  }
  candidates.sort(function (a, b) {
    return b.depth - a.depth;
  });
  pdfRemoveCandidates(candidates, outcome, roots);
}

// An unstroked solid-white path is background junk wherever it sits in the
// tree.  Deliberately unpainted whites that matter (box-plot boxes and the
// like) always carry an outline, so requiring "no stroke" keeps them safe.
function pdfIsWhiteFillPath(item) {
  try {
    if (item.stroked) return false;
    if (item.typename === 'PathItem') return pdfIsSolidFilled(item);
    if (item.typename === 'CompoundPathItem')
      return pdfCompoundIsBackground(item);
  } catch (e) {}
  return false;
}

function pdfPathIsEmpty(item) {
  if (pdfIsProtected(item)) return false;
  try {
    if (item.typename === 'PathItem') {
      // A stroked horizontal or vertical line can have zero geometric width
      // or height while still being visible.  Paint state is the reliable
      // distinction between an unused path and visible artwork.
      return !item.filled && !item.stroked;
    }
    if (item.typename === 'CompoundPathItem') {
      if (!item.pathItems || item.pathItems.length === 0) return true;
      for (var i = 0; i < item.pathItems.length; i++) {
        var child = item.pathItems[i];
        if (child.clipping) return false;
        if (child.filled || child.stroked) return false;
      }
      return true;
    }
  } catch (e) {}
  return false;
}

function pdfVisitCleanup(item, rootBounds, isRoot, depth, candidates, groups) {
  if (!item || pdfHasSciTag(item)) return;
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++)
    pdfVisitCleanup(children[i], rootBounds, false, depth + 1, candidates, groups);
  if (isRoot || pdfIsProtected(item)) return;
  var type = '';
  try {
    type = item.typename;
  } catch (e) {
    return;
  }
  if (type === 'PathItem' || type === 'CompoundPathItem') {
    var kind = '';
    if (pdfIsBackground(item, rootBounds) || pdfIsWhiteFillPath(item))
      kind = 'background';
    else if (pdfPathIsEmpty(item)) kind = 'path';
    if (kind)
      candidates.push({ item: item, kind: kind, depth: depth });
  } else if (type === 'GroupItem') {
    groups.push({ item: item, depth: depth });
  }
}

function pdfStillInDocument(item) {
  try {
    if (!item || !item.parent || !item.parent.pageItems) return false;
    var siblings = item.parent.pageItems;
    for (var i = 0; i < siblings.length; i++) {
      if (siblings[i] === item) return true;
    }
  } catch (e) {
    return false;
  }
  return false;
}

// Releasing a clipping mask turns the mask path into an unpainted path.  It
// was protected during the initial scan, so remove these newly exposed empty
// paths in a second pass after mask release.
function pdfRemoveReleasedEmptyPaths(items, stats) {
  for (var i = 0; i < items.length; i++) {
    try {
      var item = items[i];
      if (!pdfStillInDocument(item) || pdfIsProtected(item)) continue;
      if (
        (item.typename === 'PathItem' ||
          item.typename === 'CompoundPathItem') &&
        pdfPathIsEmpty(item)
      ) {
        item.remove();
        stats.removedPaths++;
      }
    } catch (e) {}
  }
}

function pdfRemoveEmptyGroups(groups, stats) {
  for (var i = 0; i < groups.length; i++) {
    try {
      var group = groups[i].item;
      if (!pdfStillInDocument(group) || pdfIsProtected(group)) continue;
      var children = pdfChildren(group);
      if (children && children.length === 0) {
        group.remove();
        stats.removedGroups++;
      }
    } catch (e) {}
  }
}

function pdfRestoreSelection(doc, selection, fallback) {
  var restored = [];
  for (var i = 0; i < selection.length; i++) {
    if (pdfStillInDocument(selection[i])) restored.push(selection[i]);
  }
  if (restored.length === 0 && fallback) {
    for (var f = 0; f < fallback.length; f++) {
      if (pdfStillInDocument(fallback[f])) pdfPushUnique(restored, fallback[f]);
    }
  }
  try {
    doc.selection = restored;
  } catch (e) {}
}

function cleanupPdfSelection() {
  if (app.documents.length === 0) return sciError('errors.noDocument');
  var doc = app.activeDocument;
  var selection = doc.selection;
  if (!selection || selection.length === 0)
    return sciError('errors.pdfCleanupSelection');

  var saved = [],
    allItems = [],
    operationGroups = [],
    candidates = [],
    groups = [];
  for (var i = 0; i < selection.length; i++) {
    saved.push(selection[i]);
    pdfCollectItems(selection[i], allItems);
    pdfCollectGroups(selection[i], operationGroups, 0);
  }
  try {
    for (var r = 0; r < saved.length; r++) {
      var rootBounds = pdfBounds(saved[r]);
      if (!rootBounds) return sciError('errors.pdfCleanupSelection');
      pdfVisitCleanup(saved[r], rootBounds, true, 0, candidates, groups);
      pdfCollectZTailBackgrounds(saved[r], candidates);
    }
  } catch (preflightError) {
    pdfRestoreSelection(doc, saved, allItems);
    return sciError('errors.pdfCleanupFailed', [preflightError.message]);
  }

  candidates.sort(function (a, b) {
    return b.depth - a.depth;
  });
  var outcome = {
      removedBackgrounds: 0,
      removedPaths: 0,
      removedGroups: 0,
      sizes: []
    },
    stats = {
      changedFonts: 0,
      releasedMasks: 0,
      ungroupedGroups: 0,
      embeddedImages: 0
    },
    warnings = [];
  // Every phase is best effort: an unexpected error is reported as a warning
  // on the success summary instead of failing the whole cleanup, because the
  // steps before it have already changed the document.
  try {
    pdfRemoveCandidates(candidates, outcome, saved);
  } catch (removeError) {
    warnings.push(String((removeError && removeError.message) || removeError));
  }
  try {
    for (var a = 0; a < saved.length; a++) pdfApplyArial(saved[a], stats);
    pdfReleaseMasks(doc, saved, stats, operationGroups);
    var releasedPathStats = { removedPaths: 0 };
    pdfRemoveReleasedEmptyPaths(allItems, releasedPathStats);
    outcome.removedPaths += releasedPathStats.removedPaths;
    pdfUngroup(doc, saved, stats, operationGroups);
    pdfEmbedItems(allItems, stats);
  } catch (restructureError) {
    warnings.push(
      String((restructureError && restructureError.message) || restructureError)
    );
  }
  try {
    groups.sort(function (a, b) {
      return b.depth - a.depth;
    });
    var postStats = { removedPaths: 0, removedGroups: 0 };
    pdfRemoveEmptyGroups(groups, postStats);
    outcome.removedPaths += postStats.removedPaths;
    outcome.removedGroups += postStats.removedGroups;
    pdfSecondPassBackgrounds(saved, outcome);
  } catch (finalError) {
    warnings.push(String((finalError && finalError.message) || finalError));
  }
  pdfRestoreSelection(doc, saved, allItems);
  var result = {
    removedBackgrounds: outcome.removedBackgrounds,
    removedPaths: outcome.removedPaths,
    removedGroups: outcome.removedGroups
  };
  if (outcome.sizes.length) result.backgroundSizes = outcome.sizes;
  if (stats.changedFonts) result.changedFonts = stats.changedFonts;
  if (stats.releasedMasks) result.releasedMasks = stats.releasedMasks;
  if (stats.ungroupedGroups) result.ungroupedGroups = stats.ungroupedGroups;
  if (stats.embeddedImages) result.embeddedImages = stats.embeddedImages;
  if (warnings.length) result.warning = warnings.join('; ');
  // 处理范围：选区比预期大时（整页 PDF 是一个编组），这里一眼可见
  result.selectionRoots = saved.length;
  result.scopeItems = allItems.length;
  return JSON.stringify(result);
}

function pdfContainsText(item) {
  try {
    if (item.typename === 'TextFrame') return true;
    var children = pdfChildren(item);
    if (children) {
      for (var i = 0; i < children.length; i++) {
        if (pdfContainsText(children[i])) return true;
      }
    }
  } catch (e) {}
  return false;
}

function pdfRatioSelectionItemValid(item) {
  if (!item || pdfContainsText(item)) return false;
  try {
    if (item.hidden || item.locked || item.typename === 'Layer') return false;
  } catch (e) {}
  var info = getVisibleInfo(item);
  return (
    !!info &&
    isFinite(info.width) &&
    isFinite(info.height) &&
    info.width > 0.0001 &&
    info.height > 0.0001
  );
}

function pdfCollectTextFrames(item, result) {
  if (!item) return;
  try {
    if (item.typename === 'TextFrame') {
      pdfPushUnique(result, item);
      return;
    }
  } catch (e) {}
  var children = pdfChildrenArray(item);
  for (var i = 0; i < children.length; i++)
    pdfCollectTextFrames(children[i], result);
}

function changeSelectedTextSize(size) {
  if (app.documents.length === 0) return sciError('errors.noDocument');
  size = Number(size);
  if (size !== 5 && size !== 6) return sciError('errors.invalidTextSize');
  var doc = app.activeDocument,
    selection = doc.selection;
  if (!selection || selection.length === 0)
    return sciError('errors.selectObjects');
  var saved = [],
    frames = [];
  for (var i = 0; i < selection.length; i++) {
    saved.push(selection[i]);
    pdfCollectTextFrames(selection[i], frames);
  }
  if (frames.length === 0) return sciError('errors.noTextFrames');
  var changed = 0;
  try {
    for (var f = 0; f < frames.length; f++) {
      if (!pdfCanEdit(frames[f])) continue;
      frames[f].textRange.characterAttributes.size = size;
      changed++;
    }
  } catch (sizeError) {
    pdfRestoreSelection(doc, saved);
    return sciError('errors.textSizeFailed', [sizeError.message]);
  }
  pdfRestoreSelection(doc, saved);
  if (changed === 0) return sciError('errors.noTextFrames');
  return JSON.stringify({ changed: changed, size: size });
}

function changeImageRatio(ratio, anchor) {
  if (app.documents.length === 0) return sciError('errors.noDocument');
  ratio = Number(ratio);
  if (!isFinite(ratio) || ratio <= 0)
    return sciError('errors.invalidImageRatio');
  if (anchor !== 'height' && anchor !== 'width')
    return sciError('errors.invalidRatioAnchor');
  var doc = app.activeDocument;
  var selection = doc.selection;
  if (!selection || selection.length === 0)
    return sciError('errors.imageRatioSelection');

  var saved = [],
    entries = [];
  for (var i = 0; i < selection.length; i++) saved.push(selection[i]);
  for (var p = 0; p < saved.length; p++) {
    if (!pdfRatioSelectionItemValid(saved[p])) {
      pdfRestoreSelection(doc, saved);
      if (pdfContainsText(saved[p])) return sciError('errors.imageRatioText');
      return sciError('errors.imageRatioSelection');
    }
    entries.push({ item: saved[p], info: getVisibleInfo(saved[p]) });
  }

  var changed = 0;
  try {
    for (var j = 0; j < entries.length; j++) {
      var entry = entries[j],
        width = entry.info.width,
        height = entry.info.height;
      var targetWidth = anchor === 'height' ? height * ratio : width;
      var targetHeight = anchor === 'height' ? height : width / ratio;
      var scaleX = (targetWidth / width) * 100;
      var scaleY = (targetHeight / height) * 100;
      if (
        Math.abs(scaleX - 100) > 0.000001 ||
        Math.abs(scaleY - 100) > 0.000001
      ) {
        entry.item.resize(
          scaleX,
          scaleY,
          true,
          true,
          true,
          true,
          100,
          Transformation.CENTER
        );
        changed++;
      }
    }
  } catch (ratioError) {
    pdfRestoreSelection(doc, saved);
    return sciError('errors.imageRatioFailed', [ratioError.message]);
  }
  pdfRestoreSelection(doc, saved);
  return JSON.stringify({ changed: changed, ratio: ratio, anchor: anchor });
}
