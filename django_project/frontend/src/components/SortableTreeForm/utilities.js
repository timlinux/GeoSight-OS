/**
 * GeoSight is UNICEF's geospatial web-based business intelligence platform.
 *
 * Contact : geosight-no-reply@unicef.org
 *
 * .. note:: This program is free software; you can redistribute it and/or modify
 *     it under the terms of the GNU Affero General Public License as published by
 *     the Free Software Foundation; either version 3 of the License, or
 *     (at your option) any later version.
 *
 * __author__ = 'irwan@kartoza.com'
 * __date__ = '13/06/2023'
 * __copyright__ = ('Copyright 2023, Unicef')
 */

import { arrayMove } from '@dnd-kit/sortable';
import { dictDeepCopy } from "../../utils/main";

export const iOS = /iPad|iPhone|iPod/.test(navigator.platform);

function getDragDepth(offset, indentationWidth) {
  return Math.round(offset / indentationWidth);
}

export function getProjection(
  items,
  activeId,
  overId,
  dragOffset,
  indentationWidth
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId);
  const activeItemIndex = items.findIndex(({ id }) => id === activeId);
  const activeItem = items[activeItemIndex];
  const newItems = arrayMove(items, activeItemIndex, overItemIndex);
  const previousItem = newItems[overItemIndex - 1];
  const nextItem = newItems[overItemIndex + 1];
  const dragDepth = getDragDepth(dragOffset, indentationWidth);
  const projectedDepth = activeItem.depth + dragDepth;
  const maxDepth = getMaxDepth({
    previousItem,
  });
  const minDepth = getMinDepth({ nextItem });
  let depth = projectedDepth;

  if (projectedDepth >= maxDepth) {
    depth = maxDepth;
  } else if (projectedDepth < minDepth) {
    depth = minDepth;
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() };

  function getParentId() {
    if (depth === 0 || !previousItem) {
      return null;
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId;
    }

    if (depth > previousItem.depth) {
      return previousItem.id;
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId;

    return newParent ?? null;
  }
}

function getMaxDepth({ previousItem }) {
  if (previousItem) {
    return previousItem.isGroup === false
      ? previousItem.depth
      : previousItem.depth + 1;
  }

  return 0;
}

function getMinDepth({ nextItem }) {
  if (nextItem) {
    return nextItem.depth;
  }

  return 0;
}

function flatten(
  items,
  parentId = null,
  data = null,
  depth = 0
) {
  return items.reduce((acc, item, index) => {
    return [
      ...acc,
      { ...item, parentId, depth, index },
      ...flatten(item.children, item.id, item.data, depth + 1),
    ];
  }, []);
}

export function flattenTree(items) {
  return flatten(items);
}

export function createTreeData(layerData) {
  // Sort the data by order
  layerData.sort((a, b) => a.order - b.order)

  // Create a map to store the tree structure
  const treeMap = new Map();
  const childrenGroups = [];

  // Loop through each layer in the input data
  for (const layer of layerData) {
    // if it does have group
    if (layer.group) {
      // Check if the layer's group has been added to the tree map
      if (!treeMap.has(layer.group)) {
        // If the group hasn't been added, create a new group object and add it to the tree map
        const group = {
          id: layer.group,
          trueId: layer.id,
          isGroup: true,
          data: null,
          children: []
        };
        treeMap.set(layer.group, group);

        // If the group has a parent group, add it as a child of the parent group
        if (layer.group_parent) {
          const parentGroup = treeMap.get(layer.group_parent);
          if (typeof parentGroup !== 'undefined') {
            parentGroup.children.push(group);
            childrenGroups.push(group)
          }
        }
      }

      // Get the current group from the tree map
      const currentGroup = treeMap.get(layer.group);

      // Create a new layer object and add it to the current group's children array
      if (layer.name) {
        if (layer.layer) {
          delete layer.layer
        }
        const newLayer = {
          id: layer.name,
          children: [],
          isGroup: false,
          data: layer
        };
        currentGroup.children.push(newLayer);
      }
    } else {
      // Create a new layer object and add it to the current group's children array
      if (layer.name) {
        if (layer.layer) {
          delete layer.layer
        }
        const newLayer = {
          id: layer.name,
          children: [],
          isGroup: false,
          data: layer
        };
        treeMap.set(layer.id, newLayer);
      }
    }
  }

  // Return the tree as an array
  let treeData = Array.from(treeMap.values())
  for (const group of childrenGroups) {
    treeData = treeData.filter(data => data.id !== group.id)
  }
  return treeData;
}

/** ---------------- **/
/** Untree data **/
function _untree(treeData) {
  return treeData.map(data => {
    if (!data.isGroup) {
      return data.id
    } else {
      return {
        group: data.name,
        children: _untree(data.children)
      }
    }
  })
}

export function untreeData(treeData) {
  return {
    group: '',
    children: _untree(treeData)
  };
}

/** ---------------- **/

export function buildTree(flattenedItems) {
  const root = { id: 'root', children: [] };
  const nodes = { [root.id]: root };
  const items = flattenedItems.map((item) => ({ ...item, children: [] }));

  for (const item of items) {
    const { id, children } = item;
    const parentId = item.parentId ?? root.id;
    const parent = nodes[parentId] ?? findItem(items, parentId);

    nodes[id] = { id, children };
    parent.children.push(item);
  }

  return root.children;
}

export function findItem(items, itemId) {
  return items.find(({ id }) => id === itemId);
}

export function findAllGroups(items) {
  const flattenItems = flattenTree(items)
  return flattenItems.filter((obj) => {
    return obj.isGroup === true
  })
}

export function findItemDeep(
  items,
  itemId
) {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return item;
    }

    if (children.length) {
      const child = findItemDeep(children, itemId);

      if (child) {
        return child;
      }
    }
  }

  return undefined;
}

export function getDepth(items, itemId, currentDepth = 0) {
  for (const item of items) {
    const { id, children } = item;

    if (id === itemId) {
      return currentDepth;
    }

    if (children.length) {
      const depth = getDepth(children, itemId, currentDepth + 1);
      if (depth) {
        return depth;
      }
    }
  }

  return undefined;
}

export function removeItem(items, id) {
  const newItems = [];

  for (const item of items) {
    if (item.id === id) {
      continue;
    }

    if (item.children.length) {
      item.children = removeItem(item.children, id);
    }

    newItems.push(item);
  }

  return newItems;
}

export function setProperty(
  items,
  id,
  property,
  setter
) {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property]);
      continue;
    }

    if (item.children.length) {
      item.children = setProperty(item.children, id, property, setter);
    }
  }

  return [...items];
}

function countChildren(items, count = 0) {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1);
    }

    return acc + 1;
  }, count);
}

export function getChildCount(items, id) {
  if (!id) {
    return 0;
  }

  const item = findItemDeep(items, id);

  return item ? countChildren(item.children) : 0;
}

export function removeChildrenOf(items, ids) {
  const excludeParentIds = [...ids];

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id);
      }
      return false;
    }

    return true;
  });
}

/** Data structure to tree data */
export function dataStructureToTreeData(data, dataStructure, groupList = []) {
  if (!data || !dataStructure) {
    return []
  }
  return dataStructure.children.map(child => {
    if (!child) {
      return null
    }
    if (child.group) {
      return {
        id: groupList.concat(child.group).join('->'),
        name: child.group,
        isGroup: true,
        data: null,
        children: dataStructureToTreeData(
          data, child, groupList.concat(child.group))

      }
    } else {
      const layerData = data.find(row => row.id === child)
      if (layerData) {
        layerData.group = groupList.join('->')
        return {
          id: child,
          name: layerData.name,
          children: [],
          isGroup: false,
          data: layerData
        }
      } else {
        return null
      }
    }
  }).filter(child => child !== null)
}

/** Data structure to tree data */
export function dataStructureToListData(data, dataStructure, groupList = []) {
  if (!data || !dataStructure) {
    return []
  }
  let output = []
  dataStructure.children.map(child => {
    if (!child) {
      return []
    }
    if (child.group) {
      output = output.concat([
          {
            id: groupList.concat(child.group).join('->'),
            name: child.group,
            isGroup: true,
            data: null

          }
        ]
      )
      output = output.concat(
        dataStructureToListData(data, child, groupList.concat(child.group))
      )
    } else {
      const layerData = data.find(row => row.id === child)
      if (layerData) {
        layerData.group = groupList.join('->')
        output = output.concat(
          [{
            id: child,
            name: layerData.name,
            children: [],
            isGroup: false,
            data: layerData
          }]
        )
      } else {
        return []
      }
    }
  })
  return output
}

/** Return group in structure **/
export function _returnGroupInStructure(structure, idList, updateFunction) {
  if (!structure.children) {
    return
  }
  idList = dictDeepCopy(idList)
  const id = idList[0]
  if (id === '') {
    updateFunction(structure, structure)
    return;
  }
  idList.shift()
  structure.children.map(child => {
    if (child?.group && child?.group === id) {
      if (idList.length) {
        _returnGroupInStructure(child, idList, updateFunction)
      } else {
        updateFunction(child, structure)
      }
    } else {
      if (child.children) {
        _returnGroupInStructure(child, idList, updateFunction)
      }
    }
  })
}

/** Update group in structure **/
export function updateGroupInStructure(id, structure, updateFunction) {
  if (id !== undefined) {
    _returnGroupInStructure(structure, id.split('->'), updateFunction)
  }
}

/** Update child in structure **/
export function addChildToGroupInStructure(id, child, structure, callback) {
  updateGroupInStructure(id, structure, data => {
    if (!data.children.includes(child)) {
      data.children.push(child)
    }
    if (callback) {
      callback()
    }
  })
}

/** Remove child from structure **/
export function removeChildInGroupInStructure(id, child, structure, callback) {
  if (id !== undefined) {
    _returnGroupInStructure(structure, id.split('->'), data => {
      const index = data.children.indexOf(child);
      if (index > -1) {
        data.children.splice(index, 1)
        if (callback) {
          callback()
        }
      }
    })
  }
}