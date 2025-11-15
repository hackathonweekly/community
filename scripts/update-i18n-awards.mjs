#!/usr/bin/env node
/**
 * Update missing translations under events.hackathon.awards for en and zh.
 * Keeps existing noAwards/noAwardsDesc if present.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const root = resolve(__dirname, '..');
const translationsDir = resolve(root, 'src/lib/i18n/translations');

/**
 * Load, update, and save a locale file.
 * @param {string} locale
 */
function updateLocale(locale) {
  const file = resolve(translationsDir, `${locale}.json`);
  const json = JSON.parse(readFileSync(file, 'utf8'));

  // Ensure object path exists
  json.events ||= {};
  json.events.hackathon ||= {};
  json.events.hackathon.awards ||= {};

  const existing = json.events.hackathon.awards;

  /** @type {Record<string,string>} */
  const base =
    locale === 'zh'
      ? {
          title: '奖项与荣誉',
          description: '了解本次黑客松的奖项类别与获奖方式',
          categories: '奖项类别',
          judgeAward: '评审奖',
          publicAward: '人气奖',
          winner: '获奖名额',
          winners: '获奖名额',
          currentWinners: '当前获奖者',
          noWinnersYet: '暂无获奖者，评审结束后公布',
          judgeAwards: '评审类奖项',
          judgeAwardsDesc: '由评审团根据评审标准评选产生',
          publicAwards: '公共投票类',
          publicAwardsDesc: '由社区用户投票产生',
          recognition: '奖项等级',
          recognitionDesc: '金/银/铜等不同等级用于表彰优秀项目',
          first: '一等奖',
          firstDesc: '最高荣誉，授予最优秀的项目',
          second: '二等奖',
          secondDesc: '表彰表现出色的项目',
          third: '三等奖',
          thirdDesc: '表彰具有潜力的项目',
          noAwards: existing.noAwards ?? '暂无奖项',
          noAwardsDesc: existing.noAwardsDesc ?? '暂无奖项设置',
        }
      : {
          title: 'Awards & Prizes',
          description: 'Explore the award categories and recognition for this hackathon',
          categories: 'Award Categories',
          judgeAward: "Judges' Award",
          publicAward: "People's Choice",
          winner: 'winner',
          winners: 'winners',
          currentWinners: 'Current Winners',
          noWinnersYet: 'Winners will be announced after judging',
          judgeAwards: 'Judged Awards',
          judgeAwardsDesc: 'Selected by the judging panel based on criteria',
          publicAwards: 'Public Awards',
          publicAwardsDesc: 'Voted by the community',
          recognition: 'Recognition Levels',
          recognitionDesc: 'Gold, Silver and Bronze distinctions highlight excellence',
          first: 'First Prize',
          firstDesc: 'Top recognition for outstanding projects',
          second: 'Second Prize',
          secondDesc: 'Recognizing excellent work',
          third: 'Third Prize',
          thirdDesc: 'Honoring promising projects',
          noAwards: existing.noAwards ?? 'No awards available',
          noAwardsDesc:
            existing.noAwardsDesc ?? 'No awards have been configured for this hackathon',
        };

  json.events.hackathon.awards = {
    ...base,
  };

  writeFileSync(file, JSON.stringify(json, null, 2) + '\n', 'utf8');
  return file;
}

const updated = [updateLocale('en'), updateLocale('zh')];
console.log('Updated awards translations in:', updated.join(', '));

