#!/usr/bin/env python3
"""Parse sprint-status.yaml and output JSON state summary for the auto-sprint loop."""

import sys
import json
import re
import argparse


def parse_sprint_status(filepath, epic_num=None):
    """Parse sprint-status.yaml. If epic_num given, scope to that epic only.
    If epic_num is None, auto-detect first incomplete epic."""

    all_stories = {}

    with open(filepath, "r") as f:
        lines = f.readlines()

    in_dev_status = False
    for line in lines:
        stripped = line.strip()

        if stripped.startswith("#") or not stripped:
            continue

        if stripped == "development_status:":
            in_dev_status = True
            continue

        if in_dev_status and ":" in stripped:
            if not line[0].isspace() and stripped != "development_status:":
                in_dev_status = False
                continue

            key, value = stripped.split(":", 1)
            key = key.strip()
            value = value.strip()

            if key.startswith("epic-") or key.endswith("-retrospective"):
                continue

            if not re.match(r"^\d+-\d+-", key):
                continue

            if value == "drafted":
                value = "ready-for-dev"

            all_stories[key] = value

    # Auto-detect epic if not specified: find first epic with non-done stories
    if epic_num is None:
        epics_with_incomplete = set()
        for key, status in all_stories.items():
            if status != "done":
                epic_n = key.split("-")[0]
                epics_with_incomplete.add(int(epic_n))
        if epics_with_incomplete:
            epic_num = min(epics_with_incomplete)

    # Filter stories to target epic
    if epic_num is not None:
        prefix = f"{epic_num}-"
        filtered = {k: v for k, v in all_stories.items() if k.startswith(prefix)}
    else:
        filtered = all_stories

    # Build result
    result = {
        "complete": False,
        "next_action": "complete",
        "next_story_key": None,
        "epic": epic_num,
        "counts": {"backlog": 0, "ready_for_dev": 0, "in_progress": 0, "review": 0, "done": 0},
        "stories": filtered,
    }

    for status in filtered.values():
        count_key = status.replace("-", "_")
        if count_key in result["counts"]:
            result["counts"][count_key] += 1

    # Determine next action (same priority as bmad-sprint-status step 3)
    def story_sort_key(s):
        parts = s.split("-")
        try:
            return (int(parts[0]), int(parts[1]))
        except (ValueError, IndexError):
            return (999, 999)

    stories_by_status = {}
    for k, v in filtered.items():
        stories_by_status.setdefault(v, []).append(k)

    if "in-progress" in stories_by_status:
        first = sorted(stories_by_status["in-progress"], key=story_sort_key)[0]
        result["next_action"] = "dev-story"
        result["next_story_key"] = first
    elif "review" in stories_by_status:
        first = sorted(stories_by_status["review"], key=story_sort_key)[0]
        result["next_action"] = "code-review"
        result["next_story_key"] = first
    elif "ready-for-dev" in stories_by_status:
        first = sorted(stories_by_status["ready-for-dev"], key=story_sort_key)[0]
        result["next_action"] = "dev-story"
        result["next_story_key"] = first
    elif "backlog" in stories_by_status:
        first = sorted(stories_by_status["backlog"], key=story_sort_key)[0]
        result["next_action"] = "create-story"
        result["next_story_key"] = first
    else:
        result["next_action"] = "complete"
        result["complete"] = True

    return result


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Parse sprint-status.yaml for auto-sprint loop")
    parser.add_argument("filepath", help="Path to sprint-status.yaml")
    parser.add_argument("--epic", type=int, default=None, help="Epic number to scope to (auto-detects if omitted)")
    args = parser.parse_args()

    try:
        data = parse_sprint_status(args.filepath, args.epic)
        print(json.dumps(data))
    except FileNotFoundError:
        print(json.dumps({"complete": False, "next_action": "sprint-planning", "error": "file not found"}))
    except Exception as e:
        print(json.dumps({"complete": False, "next_action": "error", "error": str(e)}))
        sys.exit(1)
