import type { Path } from '../../type';
import { assemblePath } from '../public';

export function invalidPathToValueError(path: Path) {
  return new Error(`${assemblePath(path)} 无法指向一个值类型!`);
}

export function invalidPathToObjectishError(path: Path) {
  return new Error(`${assemblePath(path)} 无法指向一个引用对象!`);
}
