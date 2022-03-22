import { Plugin } from '../type';
import affairPlugin, { AffairPluginExt } from './affair-plugin';
import queryPlugin, { QueryPluginExt } from './query-plugin';

export type PresetPluginsExt = QueryPluginExt & AffairPluginExt;

export const presetPlugins: Plugin[] = [queryPlugin, affairPlugin];
