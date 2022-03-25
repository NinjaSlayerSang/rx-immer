import { Plugin } from '../type';
import { affairPlugin, AffairPluginExt, queryPlugin, QueryPluginExt } from '.';

export type PresetPluginsExt = QueryPluginExt & AffairPluginExt;

export const presetPlugins: Plugin[] = [queryPlugin, affairPlugin];
