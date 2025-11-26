#!/usr/bin/env tsx
/**
 * Scrape UFCStats event pages into ingest-ready FightInput rows (with detailed stats).
 *
 * Usage examples:
 *   tsx scripts/scrapeUfcEvents.ts --limit 50 --output fights.json
 *   tsx scripts/scrapeUfcEvents.ts --url http://ufcstats.com/event-details/92c96df8bdab5fea
 *   tsx scripts/scrapeUfcEvents.ts --eventsUrl http://ufcstats.com/statistics/events/completed?page=all --delayMs 300
 *
 * Flags:
 *   --eventsUrl <url>   UFCStats events listing page (default completed?page=all)
 *   --limit <n>         Max events to scrape from the listing (after applying --url), most recent first
 *   --url <url>         Specific event-details URL (can be repeated)
 *   --output <p>        Write JSON to file (prints to stdout when omitted)
 *   --description       Optional description for the payload
 *   --delayMs <n>       Milliseconds to sleep between event requests (default 450)
 *   --fightDelayMs <n>  Milliseconds to sleep between fight-detail requests (default 200)
 *   --skipFightDetails  Skip per-fight detail pages (only event table stats)
 */

import fs from "fs";
import { promisify } from "util";
import { load, type Cheerio, type CheerioAPI, type Element } from "cheerio";
import { FightInput } from "../src/lib/elo/engine";

type Winner = FightInput["winner"];

type AttemptStat = {
  landed: number | null;
  attempted: number | null;
};

type TotalsRow = {
  kd: number | null;
  sigStr: AttemptStat;
  sigStrPct: number | null;
  totalStr: AttemptStat;
  td: AttemptStat;
  tdPct: number | null;
  subAtt: number | null;
  rev: number | null;
  ctrl: number | null; // seconds of control
};

type SignificantRow = {
  sigStr: AttemptStat;
  sigStrPct: number | null;
  head: AttemptStat;
  body: AttemptStat;
  leg: AttemptStat;
  distance: AttemptStat;
  clinch: AttemptStat;
  ground: AttemptStat;
};

type TargetSplitPct = {
  head: number | null;
  body: number | null;
  leg: number | null;
};

type PositionSplitPct = {
  distance: number | null;
  clinch: number | null;
  ground: number | null;
};

type RoundTotals = {
  round: number;
  fighterA: TotalsRow;
  fighterB: TotalsRow;
};

type RoundSignificant = {
  round: number;
  fighterA: SignificantRow;
  fighterB: SignificantRow;
};

type FighterStats = {
  kd: number | null;
  strikes: number | null;
  takedowns: number | null;
  submissions: number | null;
};

type FightDetailStats = {
  method?: string;
  round?: number | null;
  time?: string;
  timeFormat?: string;
  referee?: string;
  finishDetails?: string;
  totals?: {
    fighterA: TotalsRow;
    fighterB: TotalsRow;
  };
  perRoundTotals?: RoundTotals[];
  significantStrikes?: {
    fighterA: SignificantRow;
    fighterB: SignificantRow;
  };
  perRoundSignificantStrikes?: RoundSignificant[];
  chartPercents?: {
    landedByTarget: {
      fighterA: TargetSplitPct;
      fighterB: TargetSplitPct;
    };
    landedByPosition: {
      fighterA: PositionSplitPct;
      fighterB: PositionSplitPct;
    };
  };
};

type ScrapedFight = FightInput & {
  fightUrl?: string;
  time?: string;
  detail?: FightDetailStats;
  stats: {
    fighterA: FighterStats;
    fighterB: FighterStats;
  };
};

type ScrapedEvent = {
  name: string;
  date?: string;
  location?: string;
  fights: ScrapedFight[];
  url: string;
};

type EventListing = {
  name?: string;
  date?: string;
  location?: string;
  url: string;
};

const DEFAULT_EVENTS_URL =
  "http://ufcstats.com/statistics/events/completed?page=all";
const sleep = promisify(setTimeout);

type Args = {
  eventsUrl: string;
  limit?: number;
  urls: string[];
  output?: string;
  description?: string;
  delayMs: number;
  fightDelayMs: number;
  skipFightDetails: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    eventsUrl: DEFAULT_EVENTS_URL,
    urls: [],
    delayMs: 450,
    fightDelayMs: 200,
    skipFightDetails: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--eventsUrl") {
      args.eventsUrl = argv[i + 1];
      i += 1;
    } else if (arg === "--limit") {
      args.limit = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--url") {
      args.urls.push(argv[i + 1]);
      i += 1;
    } else if (arg === "--output") {
      args.output = argv[i + 1];
      i += 1;
    } else if (arg === "--description") {
      args.description = argv[i + 1];
      i += 1;
    } else if (arg === "--delayMs") {
      args.delayMs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--fightDelayMs") {
      args.fightDelayMs = Number(argv[i + 1]);
      i += 1;
    } else if (arg === "--skipFightDetails") {
      args.skipFightDetails = true;
    }
  }

  return args;
}

function clean(text?: string | null) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function toIsoDate(dateText?: string | null) {
  const parsed = dateText ? new Date(clean(dateText)) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return undefined;
  return parsed.toISOString().slice(0, 10);
}

function toNumber(value?: string | null): number | null {
  const trimmed = clean(value);
  if (!trimmed) return null;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function toPercent(value?: string | null): number | null {
  const trimmed = clean(value).replace("%", "");
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : null;
}

function safePercent(part?: number | null, total?: number | null): number | null {
  if (part === null || part === undefined || total === null || total === undefined)
    return null;
  if (total <= 0) return null;
  return Math.floor((part / total) * 100);
}

function toSeconds(time?: string | null): number | null {
  const trimmed = clean(time);
  if (!trimmed || trimmed === "---") return null;
  const parts = trimmed.split(":").map((p) => Number(p));
  if (parts.some((p) => Number.isNaN(p))) return null;
  if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return null;
}

function normalizeWinner(resultText: string): Winner {
  const normalized = clean(resultText).toLowerCase();
  if (normalized.includes("win")) return "fighterA";
  if (normalized.includes("draw")) return "draw";
  if (normalized.includes("nc") || normalized.includes("no contest"))
    return "no-contest";
  return "no-contest";
}

function normalizeMethod(method?: string | null) {
  const m = clean(method).toLowerCase();
  if (!m) return undefined;
  if (m.includes("tko")) return "tko";
  if (m.includes("ko")) return "ko";
  if (m === "sub" || m.includes("submission") || m.includes("sub ")) {
    return "submission";
  }
  if (m.includes("decision") || m === "dec") return "decision";
  return m;
}

function parseStatPair(cell: Cheerio<Element>): [number | null, number | null] {
  const text = clean(cell.find(".b-fight-details__table-text").text());
  if (!text) return [null, null];

  const values = text
    .split(" ")
    .map((entry) => toNumber(entry))
    .filter((val): val is number => val !== null);

  return [values[0] ?? null, values[1] ?? null];
}

function elementText(el: Element): string {
  const anyEl = el as unknown as {
    data?: string;
    children?: Element[];
    type?: string;
  };

  if (anyEl.type === "text") {
    return anyEl.data ?? "";
  }

  if (anyEl.children && anyEl.children.length) {
    return anyEl.children.map((child) => elementText(child)).join("");
  }

  return anyEl.data ?? "";
}

function parseTextPair(cell: Cheerio<Element>): [string, string] {
  const texts = cell
    .find(".b-fight-details__table-text")
    .toArray()
    .map((el) => clean(elementText(el)))
    .filter((t) => t.length > 0);

  return [texts[0] ?? "", texts[1] ?? ""];
}

function parseNumberPair(cell: Cheerio<Element>): [number | null, number | null] {
  const [a, b] = parseTextPair(cell);
  return [toNumber(a), toNumber(b)];
}

function parseAttempt(text: string): AttemptStat {
  const match = clean(text).match(/(\d+)\s*of\s*(\d+)/i);
  if (match) {
    return { landed: Number(match[1]), attempted: Number(match[2]) };
  }
  return { landed: toNumber(text), attempted: null };
}

function parseAttemptPair(cell: Cheerio<Element>): [AttemptStat, AttemptStat] {
  const [a, b] = parseTextPair(cell);
  return [parseAttempt(a), parseAttempt(b)];
}

function parsePercentPair(cell: Cheerio<Element>): [number | null, number | null] {
  const [a, b] = parseTextPair(cell);
  return [toPercent(a), toPercent(b)];
}

function parseControlPair(cell: Cheerio<Element>): [number | null, number | null] {
  const [a, b] = parseTextPair(cell);
  return [toSeconds(a), toSeconds(b)];
}

function toTotalsRow(cells: Cheerio<Element>): { fighterA: TotalsRow; fighterB: TotalsRow } {
  const kd = parseNumberPair(cells.eq(1));
  const sigStr = parseAttemptPair(cells.eq(2));
  const sigPct = parsePercentPair(cells.eq(3));
  const totalStr = parseAttemptPair(cells.eq(4));
  const td = parseAttemptPair(cells.eq(5));
  const tdPct = parsePercentPair(cells.eq(6));
  const subAtt = parseNumberPair(cells.eq(7));
  const rev = parseNumberPair(cells.eq(8));
  const ctrl = parseControlPair(cells.eq(9));

  return {
    fighterA: {
      kd: kd[0],
      sigStr: sigStr[0],
      sigStrPct: sigPct[0],
      totalStr: totalStr[0],
      td: td[0],
      tdPct: tdPct[0],
      subAtt: subAtt[0],
      rev: rev[0],
      ctrl: ctrl[0],
    },
    fighterB: {
      kd: kd[1],
      sigStr: sigStr[1],
      sigStrPct: sigPct[1],
      totalStr: totalStr[1],
      td: td[1],
      tdPct: tdPct[1],
      subAtt: subAtt[1],
      rev: rev[1],
      ctrl: ctrl[1],
    },
  };
}

function toSignificantRow(
  cells: Cheerio<Element>
): { fighterA: SignificantRow; fighterB: SignificantRow } {
  const sigStr = parseAttemptPair(cells.eq(1));
  const sigPct = parsePercentPair(cells.eq(2));
  const head = parseAttemptPair(cells.eq(3));
  const body = parseAttemptPair(cells.eq(4));
  const leg = parseAttemptPair(cells.eq(5));
  const distance = parseAttemptPair(cells.eq(6));
  const clinch = parseAttemptPair(cells.eq(7));
  const ground = parseAttemptPair(cells.eq(8));

  return {
    fighterA: {
      sigStr: sigStr[0],
      sigStrPct: sigPct[0],
      head: head[0],
      body: body[0],
      leg: leg[0],
      distance: distance[0],
      clinch: clinch[0],
      ground: ground[0],
    },
    fighterB: {
      sigStr: sigStr[1],
      sigStrPct: sigPct[1],
      head: head[1],
      body: body[1],
      leg: leg[1],
      distance: distance[1],
      clinch: clinch[1],
      ground: ground[1],
    },
  };
}

function computeChartPercents(
  sig?: { fighterA: SignificantRow; fighterB: SignificantRow }
): FightDetailStats["chartPercents"] | undefined {
  if (!sig) return undefined;

  const makeTarget = (row: SignificantRow): TargetSplitPct => {
    const total = row.sigStr.landed;
    return {
      head: safePercent(row.head.landed, total),
      body: safePercent(row.body.landed, total),
      leg: safePercent(row.leg.landed, total),
    };
  };

  const makePosition = (row: SignificantRow): PositionSplitPct => {
    const total = row.sigStr.landed;
    return {
      distance: safePercent(row.distance.landed, total),
      clinch: safePercent(row.clinch.landed, total),
      ground: safePercent(row.ground.landed, total),
    };
  };

  return {
    landedByTarget: {
      fighterA: makeTarget(sig.fighterA),
      fighterB: makeTarget(sig.fighterB),
    },
    landedByPosition: {
      fighterA: makePosition(sig.fighterA),
      fighterB: makePosition(sig.fighterB),
    },
  };
}

function parseEventsListing(html: string): EventListing[] {
  const $ = load(html);
  const events: EventListing[] = [];

  $(".b-statistics__table-events tbody tr").each((_, row) => {
    const rowNode = $(row);
    const link = rowNode.find("a").first();
    const href = link.attr("href");

    if (!href) return;

    const name = clean(link.text());
    const date = toIsoDate(rowNode.find(".b-statistics__date").text());
    const location = clean(rowNode.find("td").eq(1).text());

    events.push({
      name: name || undefined,
      date,
      location: location || undefined,
      url: href,
    });
  });

  return events;
}

function extractEventMeta($: CheerioAPI) {
  const meta: { date?: string; location?: string } = {};

  $(".b-list__box-list-item").each((_, li) => {
    const label = clean(
      $(li).find(".b-list__box-item-title").first().text()
    ).replace(/:$/, "");
    const value = clean($(li).text().replace(/^[^:]+:\s*/, ""));
    if (!label) return;

    if (label.toLowerCase() === "date") {
      meta.date = toIsoDate(value);
    } else if (label.toLowerCase() === "location") {
      meta.location = value || undefined;
    }
  });

  return meta;
}

function parseFightDetails(html: string): FightDetailStats {
  const $ = load(html);

  const detail: FightDetailStats = {};

  const detailBlocks = $(".b-fight-details__text");
  const metaItems = detailBlocks
    .first()
    .find(".b-fight-details__text-item_first, .b-fight-details__text-item");

  metaItems.each((_, item) => {
    const node = $(item);
    const label = clean(node.find(".b-fight-details__label").text())
      .replace(/:$/, "")
      .toLowerCase();
    const value = clean(
      node
        .clone()
        .children(".b-fight-details__label")
        .remove()
        .end()
        .text()
    );

    if (!label) return;

    if (label === "method") {
      detail.method = value || undefined;
    } else if (label === "round") {
      detail.round = toNumber(value);
    } else if (label === "time") {
      detail.time = value || undefined;
    } else if (label === "time format") {
      detail.timeFormat = value || undefined;
    } else if (label === "referee") {
      detail.referee = value || undefined;
    }
  });

  const finishDetails = detailBlocks
    .filter((_, el) =>
      clean($(el).find(".b-fight-details__label").first().text()).startsWith(
        "Details"
      )
    )
    .first();

  if (finishDetails.length) {
    const value = clean(
      finishDetails
        .clone()
        .find(".b-fight-details__label")
        .remove()
        .end()
        .text()
        .replace(/^Details:\s*/i, "")
    );
    detail.finishDetails = value || undefined;
  }

  const tablesWithHead = $("thead.b-fight-details__table-head");
  const totalsTable = tablesWithHead.eq(0).closest("table");
  const sigTotalsTable = tablesWithHead.eq(1).closest("table");

  const roundHeadTables = $("thead.b-fight-details__table-head_rnd");
  const perRoundTotalsTable = roundHeadTables.eq(0).closest("table");
  const perRoundSigTable = roundHeadTables.eq(1).closest("table");

  if (totalsTable.length) {
    const row = totalsTable.find("tbody tr.b-fight-details__table-row").first();
    const cells = row.find(".b-fight-details__table-col");
    if (cells.length) {
      detail.totals = toTotalsRow(cells);
    }
  }

  if (perRoundTotalsTable.length) {
    const rounds: RoundTotals[] = [];
    perRoundTotalsTable
      .find("thead.b-fight-details__table-row_type_head")
      .each((_, head) => {
        const roundNum = toNumber(
          clean($(head).text()).replace(/[^0-9]/g, "")
        );
        const row = $(head)
          .nextAll("tr.b-fight-details__table-row")
          .first();
        const cells = row.find(".b-fight-details__table-col");
        if (!roundNum || !cells.length) return;
        const parsed = toTotalsRow(cells);
        rounds.push({
          round: roundNum,
          fighterA: parsed.fighterA,
          fighterB: parsed.fighterB,
        });
      });
    if (rounds.length) {
      detail.perRoundTotals = rounds;
    }
  }

  if (sigTotalsTable.length) {
    const row = sigTotalsTable
      .find("tbody tr.b-fight-details__table-row")
      .first();
    const cells = row.find(".b-fight-details__table-col");
    if (cells.length) {
      detail.significantStrikes = toSignificantRow(cells);
      detail.chartPercents = computeChartPercents(detail.significantStrikes);
    }
  }

  if (perRoundSigTable.length) {
    const rounds: RoundSignificant[] = [];
    perRoundSigTable
      .find("thead.b-fight-details__table-row_type_head")
      .each((_, head) => {
        const roundNum = toNumber(
          clean($(head).text()).replace(/[^0-9]/g, "")
        );
        const row = $(head)
          .nextAll("tr.b-fight-details__table-row")
          .first();
        const cells = row.find(".b-fight-details__table-col");
        if (!roundNum || !cells.length) return;
        const parsed = toSignificantRow(cells);
        rounds.push({
          round: roundNum,
          fighterA: parsed.fighterA,
          fighterB: parsed.fighterB,
        });
      });
    if (rounds.length) {
      detail.perRoundSignificantStrikes = rounds;
    }
  }

  return detail;
}

function parseEventPage(html: string, summary: EventListing): ScrapedEvent {
  const $ = load(html);

  const eventName =
    clean($(".b-content__title-highlight").first().text()) ||
    summary.name ||
    summary.url;

  const meta = extractEventMeta($);
  const date = meta.date ?? summary.date;
  const location = meta.location ?? summary.location;

  if (!date) {
    throw new Error(`Missing event date for ${eventName}`);
  }

  const fights: ScrapedFight[] = [];

  $(".b-fight-details__table-body .b-fight-details__table-row").each(
    (_, row) => {
      const rowNode = $(row);
      const cells = rowNode.find(".b-fight-details__table-col");
      const fighterLinks = cells.eq(1).find("a.b-link_style_black");
      const fighterA = clean(fighterLinks.eq(0).text());
      const fighterB = clean(fighterLinks.eq(1).text());

      if (!fighterA || !fighterB) return;

      const resultText =
        clean(rowNode.find(".b-flag__text").first().text()) ||
        clean(cells.eq(0).text());

      const [kdA, kdB] = parseStatPair(cells.eq(2));
      const [strA, strB] = parseStatPair(cells.eq(3));
      const [tdA, tdB] = parseStatPair(cells.eq(4));
      const [subA, subB] = parseStatPair(cells.eq(5));

      const weightClass = clean(cells.eq(6).text()) || "unknown";
      const methodCell = cells.eq(7);
      const methodPrimary = clean(methodCell.find("p").first().text());
      const methodSecondary = clean(methodCell.find("p").eq(1).text());
      const method = normalizeMethod(methodPrimary || methodSecondary);

      const rounds = toNumber(cells.eq(8).text());
      const time = clean(cells.eq(9).text()) || undefined;

      fights.push({
        date,
        event: eventName,
        fighterA,
        fighterB,
        winner: normalizeWinner(resultText),
        method,
        rounds: rounds ?? null,
        weightClass: weightClass.toLowerCase(),
        fightUrl: rowNode.attr("data-link") || undefined,
        time,
        stats: {
          fighterA: {
            kd: kdA,
            strikes: strA,
            takedowns: tdA,
            submissions: subA,
          },
          fighterB: {
            kd: kdB,
            strikes: strB,
            takedowns: tdB,
            submissions: subB,
          },
        },
      });
    }
  );

  return {
    name: eventName,
    date,
    location,
    fights,
    url: summary.url,
  };
}

async function fetchHtml(url: string) {
  const resp = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36",
    },
  });
  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status} for ${url}`);
  }
  return resp.text();
}

async function scrapeEvent(
  summary: EventListing,
  options: { fetchFightDetails: boolean; fightDelayMs: number }
): Promise<ScrapedEvent> {
  const html = await fetchHtml(summary.url);
  const event = parseEventPage(html, summary);

  if (!options.fetchFightDetails) return event;

  for (let i = 0; i < event.fights.length; i += 1) {
    const fight = event.fights[i];
    if (!fight.fightUrl) continue;

    try {
      const fightHtml = await fetchHtml(fight.fightUrl);
      const detail = parseFightDetails(fightHtml);
      fight.detail = detail;
      if (!fight.method && detail.method) {
        fight.method = normalizeMethod(detail.method);
      }
      if (!fight.rounds && detail.round) {
        fight.rounds = detail.round;
      }
      if (!fight.time && detail.time) {
        fight.time = detail.time;
      }
    } catch (err) {
      console.error(
        `⚠️  Failed to scrape fight ${fight.fightUrl}: ${(err as Error).message}`
      );
    }

    if (i < event.fights.length - 1 && options.fightDelayMs > 0) {
      await sleep(options.fightDelayMs);
    }
  }

  return event;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  let events: EventListing[] = [];
  try {
    const listingHtml = await fetchHtml(args.eventsUrl);
    events = parseEventsListing(listingHtml);
    console.error(
      `Found ${events.length} events in listing (${args.eventsUrl}).`
    );
  } catch (err) {
    console.error(
      `⚠️  Failed to load event listing: ${(err as Error).message}`
    );
  }

  for (const url of args.urls) {
    if (!events.some((event) => event.url === url)) {
      events.unshift({ url });
    }
  }

  if (args.limit && args.limit > 0) {
    events = events.slice(0, args.limit);
  }

  if (events.length === 0) {
    console.error(
      "Provide --eventsUrl to crawl UFCStats listing or one or more --url event-detail pages."
    );
    process.exit(1);
  }

  const fights: ScrapedFight[] = [];
  const failed: string[] = [];

  for (let i = 0; i < events.length; i += 1) {
    const summary = events[i];
    try {
      const event = await scrapeEvent(summary, {
        fetchFightDetails: !args.skipFightDetails,
        fightDelayMs: args.fightDelayMs,
      });
      fights.push(...event.fights);
      console.error(
        `✓ Scraped ${event.fights.length} fights from ${event.name} (${summary.url})`
      );
    } catch (err) {
      failed.push(summary.url);
      console.error(
        `⚠️  Failed to scrape ${summary.url}: ${(err as Error).message}`
      );
    }

    if (i < events.length - 1 && args.delayMs > 0) {
      await sleep(args.delayMs);
    }
  }

  const payload = {
    description:
      args.description || `UFCStats events from ${args.eventsUrl}`.trim(),
    fights,
  };

  const json = JSON.stringify(payload, null, 2);
  if (args.output) {
    fs.writeFileSync(args.output, json);
    console.error(
      `Wrote ${fights.length} fights to ${args.output}${
        failed.length ? ` (${failed.length} failed)` : ""
      }`
    );
  } else {
    console.log(json);
  }

  if (failed.length) {
    console.error(`Failed URLs (${failed.length}):`);
    failed.forEach((u) => console.error(`- ${u}`));
  }
}

void main();
