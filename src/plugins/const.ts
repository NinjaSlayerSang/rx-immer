import { Plugin } from '../type';
import {
  affairPlugin,
  AffairPluginExt,
  queryPlugin,
  QueryPluginExt,
  shortcutPlugin,
  ShortcutPluginExt,
} from '.';

export type PresetPluginsExt = ShortcutPluginExt &
  QueryPluginExt &
  AffairPluginExt;

export const presetPlugins: Plugin[] = [
  shortcutPlugin,
  queryPlugin,
  affairPlugin,
];
