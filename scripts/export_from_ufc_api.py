#!/usr/bin/env python3
"""
Convert UFC API event data into fight rows for the Elo ingest API.

Requires: pip install ufc_api
Usage:
  python scripts/export_from_ufc_api.py --event "UFC 280" --output fights.json
  python scripts/export_from_ufc_api.py --events-file events.txt --output fights.json
"""

import argparse
import json
import sys
import time
from typing import List, Dict, Any
import requests
from lxml import html

try:
  from ufc import get_event, parse_event  # provided by the ufc_api package
except ImportError as exc:
  sys.stderr.write(
    f"Missing or unreachable dependency 'ufc' from the ufc_api package ({exc}).\n"
    "Install or reinstall inside your current venv: pip install ufc_api\n"
    "If installed, ensure you're using the same python interpreter as the venv "
    "(e.g., './venv/bin/python scripts/export_from_ufc_api.py ...').\n"
  )
  sys.exit(1)


def resolve_winner(red_result: str, blue_result: str) -> str:
  r = (red_result or "").lower()
  b = (blue_result or "").lower()
  if "win" in r and "loss" in b:
    return "fighterA"
  if "loss" in r and "win" in b:
    return "fighterB"
  if "draw" in r or "draw" in b:
    return "draw"
  return "no-contest"


def event_to_rows(event_identifier: str, *, is_url: bool = False) -> List[Dict[str, Any]]:
  event = None
  if is_url:
    try:
      event = parse_event(event_identifier)
    except Exception:
      event = scrape_event(event_identifier)
  else:
    event = get_event(event_identifier)

  if not event:
    raise ValueError(f"Could not fetch event: {event_identifier}")

  rows = []
  for fight in event.get("fights", []):
    red = fight.get("red corner", {}) or {}
    blue = fight.get("blue corner", {}) or {}
    rows.append(
      {
        "date": event.get("date"),
        "event": event.get("name") or event_identifier,
        "weightClass": (fight.get("weightclass") or "unknown").lower(),
        "fighterA": red.get("name"),
        "fighterB": blue.get("name"),
        "winner": resolve_winner(red.get("result", ""), blue.get("result", "")),
        "method": fight.get("method"),
        "rounds": None,
      }
    )
  return rows


def main():
  parser = argparse.ArgumentParser(description="Export UFC event fights to Elo ingest JSON.")
  parser.add_argument("--event", action="append", help="Event name, e.g., 'UFC 280'")
  parser.add_argument("--event-url", action="append", help="Direct UFC event URL, e.g., https://www.ufc.com/event/ufc-285")
  parser.add_argument("--ufc-range", help="Range of numbered UFC events, e.g., 1-285 to fetch UFC 1 ... UFC 285 by slug")
  parser.add_argument("--events-file", help="Path to file with one event name per line")
  parser.add_argument("--output", help="Output file path (defaults to stdout)")
  parser.add_argument("--sleep", type=float, default=0.6, help="Sleep seconds between requests (default 0.6)")
  args = parser.parse_args()

  event_names = args.event or []
  event_urls = args.event_url or []

  if args.events_file:
    with open(args.events_file, "r") as f:
      event_names.extend([line.strip() for line in f if line.strip()])

  if args.ufc_range:
    event_urls.extend(build_range_urls(args.ufc_range))

  if not event_names and not event_urls:
    parser.error("Provide at least one --event, --event-url, --ufc-range, or an --events-file.")

  fights: List[Dict[str, Any]] = []
  for name in event_names:
    try:
      fights.extend(event_to_rows(name))
    except Exception as exc:  # noqa: BLE001
      sys.stderr.write(f"Failed to fetch '{name}': {exc}\n")
    time.sleep(args.sleep)

  for url in event_urls:
    try:
      fights.extend(event_to_rows(url, is_url=True))
    except Exception as exc:  # noqa: BLE001
      sys.stderr.write(f"Failed to fetch url '{url}': {exc}\n")
    time.sleep(args.sleep)

  payload = {"description": "Imported from ufc_api", "fights": fights}

  if args.output:
    with open(args.output, "w") as f:
      json.dump(payload, f, indent=2)
    print(f"Wrote {len(fights)} fights to {args.output}")
  else:
    json.dump(payload, sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
  pass


# --- Lightweight fallback scraper for UFC event pages (when ufc_api.parse_event fails) ---


def scrape_event(url: str) -> Dict[str, Any]:
  resp = requests.get(
    url,
    headers={
      "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36"
    },
    timeout=20,
  )
  resp.raise_for_status()
  xml = html.fromstring(resp.content)

  name_prefix = first_text(xml.xpath("//div[contains(@class,'c-hero__header')]//h1/text()"))
  name_parts = xml.xpath("//div[contains(@class,'c-hero__header')]/div[2]/span/span/text()")
  hero_name = f"{name_prefix}: {name_parts[0]} vs. {name_parts[-1]}" if name_prefix and len(name_parts) >= 2 else name_prefix

  date_ts = first_text(xml.xpath("//div[contains(@class,'c-hero__bottom-text')]/div[@data-timestamp]/@data-timestamp"))
  date = ""
  if date_ts.isdigit():
    try:
      import datetime as dt

      date = dt.datetime.fromtimestamp(int(date_ts)).strftime("%Y-%m-%d")
    except Exception:
      date = ""

  location_bits = xml.xpath("//div[contains(@class,'c-hero__bottom-text')]/div[2]/div/text()")
  venue = first_text(location_bits, 0)
  location = first_text(location_bits, 1)

  fights_dom = xml.xpath("//div[contains(@class,'fight-card')]//li[contains(@class,'c-listing-fight__item')]")

  fights = []
  for fight in fights_dom:
    weightclass = clean_text(
      first_text(
        fight.xpath(".//div[contains(@class,'c-listing-fight__class-text')]/text()")
      )
    )

    red_name = clean_text(
      " ".join(
        fight.xpath(
          ".//div[contains(@class,'c-listing-fight__corner--red')]//span[contains(@class,'c-listing-fight__name')]/text()"
        )
      )
    ) or clean_text(
      " ".join(
        fight.xpath(
          ".//div[contains(@class,'c-listing-fight__corner--red')]//a/span/text()"
        )
      )
    )
    blue_name = clean_text(
      " ".join(
        fight.xpath(
          ".//div[contains(@class,'c-listing-fight__corner--blue')]//span[contains(@class,'c-listing-fight__name')]/text()"
        )
      )
    ) or clean_text(
      " ".join(
        fight.xpath(
          ".//div[contains(@class,'c-listing-fight__corner--blue')]//a/span/text()"
        )
      )
    )

    outcomes = fight.xpath(".//div[contains(@class,'c-listing-fight__outcome')]//div/text()")
    red_result = first_text(outcomes, 0)
    blue_result = first_text(outcomes, 1)

    method = clean_text(
      first_text(
        fight.xpath(".//div[contains(@class,'c-listing-fight__result-text') and contains(@class,'method')]/text()")
      )
    )
    finished_round = clean_text(
      first_text(
        fight.xpath(".//div[contains(@class,'c-listing-fight__result-text') and contains(@class,'round')]/text()")
      )
    )
    finished_time = clean_text(
      first_text(
        fight.xpath(".//div[contains(@class,'c-listing-fight__result-text') and contains(@class,'time')]/text()")
      )
    )

    fights.append(
      {
        "weightclass": weightclass or "unknown",
        "red corner": {"name": red_name or "Unknown", "ranking": "Unranked", "odds": "", "link": ""},
        "blue corner": {"name": blue_name or "Unknown", "ranking": "Unranked", "odds": "", "link": ""},
        "round": finished_round or None,
        "time": finished_time or None,
        "method": method or None,
        "red result": red_result,
        "blue result": blue_result,
      }
    )

  event = {
    "name": hero_name or url,
    "date": date,
    "location": location,
    "venue": venue,
    "fights": [],
  }

  for f in fights:
    event["fights"].append(
      {
        "weightclass": f["weightclass"],
        "red corner": {
          "name": f["red corner"]["name"],
          "ranking": f["red corner"].get("ranking", "Unranked"),
          "odds": f["red corner"].get("odds", ""),
          "link": f["red corner"].get("link", ""),
          "result": f.get("red result", ""),
        },
        "blue corner": {
          "name": f["blue corner"]["name"],
          "ranking": f["blue corner"].get("ranking", "Unranked"),
          "odds": f["blue corner"].get("odds", ""),
          "link": f["blue corner"].get("link", ""),
          "result": f.get("blue result", ""),
        },
        "round": f.get("round"),
        "time": f.get("time"),
        "method": f.get("method"),
      }
    )

  return event


def first_text(items, idx=0, default=""):
  try:
    return (items[idx] or "").strip()
  except Exception:
    return default


def clean_text(value: str) -> str:
  return (value or "").replace("\n", " ").strip()


def build_range_urls(rng: str) -> List[str]:
  try:
    start_s, end_s = rng.split("-")
    start, end = int(start_s), int(end_s)
  except Exception:
    raise ValueError("Invalid --ufc-range. Use format start-end, e.g., 1-285.")
  if start > end:
    start, end = end, start
  return [f"https://www.ufc.com/event/ufc-{i}" for i in range(start, end + 1)]


if __name__ == "__main__":
  main()
