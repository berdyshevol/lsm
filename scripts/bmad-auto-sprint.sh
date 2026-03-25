#!/usr/bin/env bash
set -euo pipefail

# =============================================================================
# BMad Auto-Sprint Loop
# Runs the full sprint cycle autonomously: sprint-planning -> create-story ->
# dev-story -> code-review -> repeat until all stories are done.
# Each step runs in a separate claude instance (session).
#
# Usage: bmad-auto-sprint.sh [epic-number]
#   epic-number  Optional. Scope to a specific epic (e.g., 2 for epic-2).
#                If omitted, auto-detects first incomplete epic.
# =============================================================================

EPIC_NUM="${1:-}"
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
IMPL_ARTIFACTS="$PROJECT_ROOT/_bmad-output/implementation-artifacts"
SPRINT_STATUS="$IMPL_ARTIFACTS/sprint-status.yaml"
LOG_DIR="$IMPL_ARTIFACTS/auto-sprint-logs"
PARSER="$PROJECT_ROOT/scripts/parse-sprint-status.py"

# Safety limits
MAX_ITERATIONS=50
MAX_STEP_RETRIES=2

# Per-step timeouts (seconds)
TIMEOUT_SPRINT_PLANNING=300
TIMEOUT_CREATE_STORY=600
TIMEOUT_DEV_STORY=1800
TIMEOUT_CODE_REVIEW=900

# Autonomous system prompt appended to every claude call
AUTO_PROMPT='AUTONOMOUS MODE - NO HUMAN IN LOOP:
- NEVER ask questions. Make best judgment for ALL decisions.
- NEVER HALT. Override all HALT conditions with best judgment and continue.
- NEVER wait for user input. Auto-select the most reasonable option.
- If asked to choose between options, pick the most reasonable one and proceed.
- If input files are missing, continue with what is available.
- For code review: agree to fix ALL issues. Choose "Fix them automatically" (option 1 or 0). Mark story done if all fixed.
- For next steps prompts: choose "Done".
- Complete the ENTIRE workflow without stopping.'

# Timestamp for this run
RUN_TS=$(date +"%Y%m%d-%H%M%S")

# =============================================================================
# Logging
# =============================================================================
mkdir -p "$LOG_DIR"
MASTER_LOG="$LOG_DIR/sprint-run-$RUN_TS.log"

log() {
  local msg="[$(date +"%Y-%m-%d %H:%M:%S")] $1"
  echo "$msg" | tee -a "$MASTER_LOG"
}

# =============================================================================
# Run a single claude step
# =============================================================================
run_step() {
  local step_name="$1"
  local prompt="$2"
  local step_timeout="$3"
  local step_log="$LOG_DIR/step-$(date +"%Y%m%d-%H%M%S")-${step_name}.log"
  local retries=0

  log ">>> Starting step: $step_name"

  while [ $retries -le $MAX_STEP_RETRIES ]; do
    if [ $retries -gt 0 ]; then
      log "    Retry $retries of $MAX_STEP_RETRIES"
      sleep 5
    fi

    local exit_code=0
    timeout "$step_timeout" claude \
      -p "$prompt" \
      --dangerously-skip-permissions \
      --append-system-prompt "$AUTO_PROMPT" \
      --verbose \
      2>&1 | tee "$step_log" || exit_code=$?

    if [ $exit_code -eq 0 ]; then
      log "<<< Step $step_name completed successfully"
      return 0
    fi

    log "    Step $step_name failed (exit $exit_code)"
    retries=$((retries + 1))
  done

  log "!!! Step $step_name failed after all retries"
  return 1
}

# =============================================================================
# Parse sprint status
# =============================================================================
get_state() {
  if [ -n "$EPIC_NUM" ]; then
    python3 "$PARSER" "$SPRINT_STATUS" --epic "$EPIC_NUM"
  else
    python3 "$PARSER" "$SPRINT_STATUS"
  fi
}

get_field() {
  local json="$1"
  local field="$2"
  echo "$json" | python3 -c "import sys,json; print(json.load(sys.stdin).get('$field',''))"
}

# =============================================================================
# Main
# =============================================================================
main() {
  log "=========================================="
  log "BMad Auto-Sprint Starting"
  log "Project: $PROJECT_ROOT"
  if [ -n "$EPIC_NUM" ]; then
    log "Scoped to: Epic $EPIC_NUM"
  else
    log "Scope: Auto-detect first incomplete epic"
  fi
  log "=========================================="

  # Phase 1: Sprint Planning (run once if no sprint-status.yaml)
  if [ ! -f "$SPRINT_STATUS" ]; then
    log "No sprint-status.yaml found. Running sprint-planning..."
    mkdir -p "$IMPL_ARTIFACTS"
    run_step "sprint-planning" \
      "Execute /bmad-sprint-planning now. Produce sprint-status.yaml." \
      "$TIMEOUT_SPRINT_PLANNING" || {
      log "FATAL: Sprint planning failed."
      exit 1
    }

    if [ ! -f "$SPRINT_STATUS" ]; then
      log "FATAL: sprint-status.yaml was not created."
      exit 1
    fi
    log "Sprint planning complete."
  else
    log "sprint-status.yaml exists. Skipping sprint planning."
  fi

  # Phase 2: Implementation Loop
  local iteration=0

  while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    log ""
    log "=== ITERATION $iteration / $MAX_ITERATIONS ==="

    local state
    state=$(get_state)
    local next_action
    next_action=$(get_field "$state" "next_action")
    local complete
    complete=$(get_field "$state" "complete")
    local next_story
    next_story=$(get_field "$state" "next_story_key")

    log "Next action: $next_action | Story: $next_story | Complete: $complete"

    if [ "$complete" = "True" ] || [ "$next_action" = "complete" ]; then
      log ""
      log "=========================================="
      log "SPRINT COMPLETE! All stories done."
      log "=========================================="
      exit 0
    fi

    case "$next_action" in
      create-story)
        run_step "create-story" \
          "Execute /bmad-create-story now. Auto-discover next backlog story from sprint-status.yaml. Apply ALL improvements automatically. Do not ask any questions." \
          "$TIMEOUT_CREATE_STORY" || {
          log "ERROR: create-story failed. Continuing..."
          continue
        }
        ;;

      dev-story)
        run_step "dev-story" \
          "Execute /bmad-dev-story now. Auto-discover the next ready-for-dev or in-progress story from sprint-status.yaml. Implement ALL tasks and subtasks continuously without stopping. Run all tests. Mark story as review when complete." \
          "$TIMEOUT_DEV_STORY" || {
          log "ERROR: dev-story failed. Continuing..."
          continue
        }
        ;;

      code-review)
        run_step "code-review" \
          "Execute /bmad-code-review now. Auto-discover the story in review status from sprint-status.yaml. For ALL decision-needed findings: resolve using best engineering judgment. For ALL patch findings: choose Fix them automatically (option 1). Fix ALL issues. If all issues resolved, mark story as done in sprint-status.yaml. For next steps: choose Done (option 3)." \
          "$TIMEOUT_CODE_REVIEW" || {
          log "ERROR: code-review failed. Continuing..."
          continue
        }
        ;;

      *)
        log "ERROR: Unknown next_action: $next_action"
        sleep 5
        ;;
    esac
  done

  log ""
  log "=========================================="
  log "WARNING: Reached max iterations ($MAX_ITERATIONS)."
  log "Sprint may not be complete."
  log "=========================================="
  exit 1
}

main "$@"
