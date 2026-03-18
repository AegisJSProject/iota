import { html } from '@aegisjsproject/core/parsers/html.js';
import { $observe } from './watcher.js';

export const $html = (strings, ...values) => $observe(html(strings, ...values));
