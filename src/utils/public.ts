const isObject = (target: any) =>
  target !== null && typeof target === 'object' && !Array.isArray(target);

function updateObjectDeep(target: any, source: any) {
  const targetKeys = Object.keys(target);
  const sourceKeys = Object.keys(source);

  sourceKeys.forEach((key) => {
    if (isObject(target[key]) && isObject(source[key])) {
      updateObjectDeep(target[key], source[key]);
      return;
    }
    if (Array.isArray(target[key]) && Array.isArray(source[key])) {
      updateArrayDeep(target[key], source[key]);
      return;
    }
    target[key] = source[key];
  });

  targetKeys
    .filter((key) => !sourceKeys.includes(key))
    .forEach((key) => {
      delete target[key];
    });
}

function updateArrayDeep(target: any[], source: any[]) {
  source.forEach((entity, index) => {
    if (isObject(target[index]) && isObject(entity)) {
      updateObjectDeep(target[index], entity);
      return;
    }
    if (Array.isArray(target[index]) && Array.isArray(entity)) {
      updateArrayDeep(target[index], entity);
      return;
    }
    target[index] = entity;
  });

  target.splice(source.length, target.length - source.length);
}

export function updateDeep(target: object, source: object) {
  if (isObject(target) && isObject(source)) {
    updateObjectDeep(target, source);
    return;
  }
  if (Array.isArray(target) && Array.isArray(source)) {
    updateArrayDeep(target, source);
    return;
  }
  throw new Error('Types of target and source are not compatible!');
}
