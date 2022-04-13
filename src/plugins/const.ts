import { Plugin } from '../type';
import {
  affairPlugin,
  AffairPluginExt,
  queryPlugin,
  QueryPluginExt,
  shortcutPlugin,
  ShortcutPluginExt,
} from '.';

export type PresetPluginsExt<T> = ShortcutPluginExt<T> &
  QueryPluginExt &
  AffairPluginExt;

export const presetPlugins: Plugin[] = [
  shortcutPlugin,
  queryPlugin,
  affairPlugin,
];
