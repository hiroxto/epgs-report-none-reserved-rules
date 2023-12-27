import { denoSlackApi, dotenv } from './deps.ts';

interface EPGStationRulesResponse {
    rules: EPGStationRuleResponse[]
    total: number
}

interface EPGStationRuleResponse {
    reserveOption: ReserveOption
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

const env = await dotenv.load();
const BASE_URL = env['EPGSTATION_URL'];
const SLACK_TOKEN = env['SLACK_TOKEN'];
const SLACK_CHANNEL_ID = env['SLACK_CHANNEL_ID'];
const SLACK_BOT_NAME = env['SLACK_BOT_NAME'];
const REPORT_TITLE = env['REPORT_TITLE'];

/**
 * 予約ルールを全件取得する
 */
const fetchAllRules = async () => {
    // 合計件数を取得する
    const preFetchUrl = new URL(`${BASE_URL}/api/rules`);
    preFetchUrl.searchParams.set('limit', '1');
    preFetchUrl.searchParams.set('type', 'normal');
    preFetchUrl.searchParams.set('isHalfWidth', 'false');
    const preFetchResponse: EPGStationRulesResponse = await fetch(preFetchUrl).then(res => res.json())

    // 全件取得する
    preFetchUrl.searchParams.set('limit', String(preFetchResponse.total));
    const rawRules: EPGStationRulesResponse = await fetch(preFetchUrl).then(res => res.json());

    // 扱いやすい形に変換する
    return rawRules.rules.map<Rule>(rawRule => ({
        id: rawRule.id,
        reservesCount: rawRule.reservesCnt,
        enable: rawRule.reserveOption.enable,
        keyword: rawRule.searchOption.keyword ?? '(なし)',
        ignoreKeyword: rawRule.searchOption.ignoreKeyword ?? '(なし)',
    }));
};

/**
 * 投稿用のテキストをビルドする
 */
const buildMessageText = (rules: Rule[]) => {
    const rulesText = rules.map(rule => `ルールID:${rule.id}: キーワード:${rule.keyword}, 除外キーワード:${rule.ignoreKeyword}`).join('\n');

    return `\`${REPORT_TITLE}\`\n${rulesText}`;
};

const rules = await fetchAllRules();
// 有効なルールかつ，予約が 0 件のルールを抽出する
const noneReservedRules = rules.filter(rule => rule.enable && rule.reservesCount === 0);

if (noneReservedRules.length === 0) {
    console.info('全ての録画ルールに予約があります。');
    Deno.exit(0);
}

const slackClient = denoSlackApi.SlackAPI(SLACK_TOKEN);
await slackClient.chat.postMessage({
    text: buildMessageText(noneReservedRules),
    channel: SLACK_CHANNEL_ID,
    username : SLACK_BOT_NAME,
});
console.info(`予約のないルール件数: ${noneReservedRules.length}件`);
