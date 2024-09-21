import * as dotenv from 'dotenv';
import { WebClient } from '@slack/web-api';
import assert from 'node:assert';

interface EPGStationRulesResponse {
    rules: EPGStationRuleResponse[];
    total: number;
}

interface EPGStationRuleResponse {
    reserveOption: ReserveOption;
    searchOption: SearchOption;
    id: number;
    reservesCnt: number;
}

interface ReserveOption {
    enable: boolean;
}

interface SearchOption {
    keyword: string;
    ignoreKeyword: string;
}

interface Rule {
    id: number;
    reservesCount: number;
    enable: boolean;
    keyword: string;
    ignoreKeyword: string;
}

// 設定を読み込み
dotenv.config();
const BASE_URL = Bun.env.EPGSTATION_URL;
const SLACK_TOKEN = Bun.env.SLACK_TOKEN;
const SLACK_CHANNEL_ID = Bun.env.SLACK_CHANNEL_ID;
const SLACK_BOT_NAME = Bun.env.SLACK_BOT_NAME;
const REPORT_TITLE = Bun.env.REPORT_TITLE;
const DEFAULT_EMPTY_VALUE = Bun.env.DEFAULT_EMPTY_VALUE;

// undefined の場合はエラーにする
assert(
    typeof BASE_URL === 'string' &&
        typeof SLACK_TOKEN === 'string' &&
        typeof SLACK_CHANNEL_ID === 'string' &&
        typeof SLACK_BOT_NAME === 'string' &&
        typeof REPORT_TITLE === 'string' &&
        typeof DEFAULT_EMPTY_VALUE === 'string',
);

/**
 * 予約ルールを全件取得する
 */
const fetchAllRules = async () => {
    // 合計件数を取得する
    const fetchURL = new URL(`${BASE_URL}/api/rules`);
    fetchURL.searchParams.set('limit', '1');
    fetchURL.searchParams.set('type', 'normal');
    fetchURL.searchParams.set('isHalfWidth', 'false');
    const preFetchResponse: EPGStationRulesResponse = await fetch(fetchURL).then(res => res.json());

    // 全件取得する
    fetchURL.searchParams.set('limit', String(preFetchResponse.total));
    const rawRules: EPGStationRulesResponse = await fetch(fetchURL).then(res => res.json());

    // 扱いやすい形に変換する
    return rawRules.rules.map<Rule>(rawRule => ({
        id: rawRule.id,
        reservesCount: rawRule.reservesCnt,
        enable: rawRule.reserveOption.enable,
        keyword: rawRule.searchOption.keyword ?? DEFAULT_EMPTY_VALUE,
        ignoreKeyword: rawRule.searchOption.ignoreKeyword ?? DEFAULT_EMPTY_VALUE,
    }));
};

/**
 * 投稿用のテキストをビルドする
 */
const buildMessageText = (rules: Rule[]) => {
    const rulesText = rules.map(rule => `ルールID:${rule.id}, キーワード:${rule.keyword}, 除外キーワード:${rule.ignoreKeyword}`).join('\n');

    return `${REPORT_TITLE}\n\n${rulesText}`;
};

try {
    // ルールを全件取得する
    const rules = await fetchAllRules();

    // 有効なルールかつ，予約が 0 件のルールを抽出する
    const noneReservedRules = rules.filter(rule => rule.enable && rule.reservesCount === 0);

    // 全てのルールに予約がある場合は終了する
    if (noneReservedRules.length === 0) {
        console.info('全ての録画ルールに予約があります。');
        process.exit(0);
    }

    // 予約が 0 件のルールがある場合は Slack に通知する
    console.info(`予約のないルール件数: ${noneReservedRules.length}件`);
    const slackClient = new WebClient(SLACK_TOKEN);
    await slackClient.chat.postMessage({
        text: buildMessageText(noneReservedRules),
        channel: SLACK_CHANNEL_ID,
        username: SLACK_BOT_NAME,
    });
} catch (error) {
    console.error(error);
}
