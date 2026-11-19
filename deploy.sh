#!/bin/sh
# deploy.sh : THE ONE WAY TO DEPLOY Send a Carol (SPEC.md, "Safe builds"). Run it from anywhere: ./deploy.sh
# It deploys what is committed, and only after everything that can be known beforehand says yes:
#   1. nothing uncommitted (what is tested is what is shipped)
#   2. npm test on SQLite: the legal pages, the templates, the beat finder, the server, the money, the admin, safe
#      builds, the contract with the pages of the release before, and, when Playwright is there (PLAYWRIGHT_PATH
#      or NODE_PATH), the pages, the safe reload and the outbox in a browser. Then the same again on a real
#      Postgres when TEST_DATABASE_URL names one (each test in a schema of its own).
#   3. the build id, and what changed since the last deploy (the git tag "deployed")
#   4. fly deploy --ha=false. Fly builds the image and, BEFORE it replaces the running machine, runs
#      "node server.js --check" in a machine of its own against the real database (fly.toml, release_command): the
#      machine's settings, the schema, every table and statement, every saved carol. If that fails nothing is
#      replaced and the old build keeps running.
#   5. the live site is asked: /healthz, /, /make, /api/me, /api/templates, and that it now serves this build
#   6. only then the tag "deployed" moves here. If 5 fails: it says so, loudly, with how to go back.
#   ./deploy.sh --dry   does 1 to 3 and stops (nothing is deployed, the tag does not move)
set -eu
APP=send-a-carol
SITE=https://sendacarol.com
cd "$(dirname "$0")"
say() { printf '\n== %s\n' "$*"; }
stop() { printf '\nNOT DEPLOYED: %s\n' "$*" >&2; exit 1; }

# 1
[ -z "$(git status --porcelain)" ] || { git status --short; stop "there are uncommitted changes. Commit them (or put them away) first: what is tested must be what is shipped."; }
FLY=$(command -v fly || command -v flyctl || true)
[ -n "$FLY" ] || [ "${1:-}" = "--dry" ] || stop "the fly command is not installed here."

# 2
LOG=$(mktemp)
say "the tests, on SQLite"
if (unset TEST_DATABASE_URL; npm test) >"$LOG" 2>&1; then grep -E '^(OK|SKIPPED|PENDING) ' "$LOG" || true; else cat "$LOG"; stop "the tests failed (above)."; fi
SKIPPED=$(grep -c '^SKIPPED ' "$LOG" || true)
PENDING=$(grep -c '^PENDING ' "$LOG" || true)
if [ -n "${TEST_DATABASE_URL:-}" ]; then
  say "the tests again, on the Postgres named by TEST_DATABASE_URL"
  if npm test >"$LOG" 2>&1; then grep -E '^(OK|SKIPPED|PENDING) ' "$LOG" || true; else cat "$LOG"; stop "the tests failed on Postgres (above)."; fi
else
  echo "(TEST_DATABASE_URL is not set: not run on a Postgres here. The check that runs before the swap, in step 4, is what meets the real one.)"
fi
[ "$SKIPPED" = "0" ] || printf '\n!! %s browser check(s) were SKIPPED: Playwright is not here. The pages, the safe reload and the outbox were NOT run in a browser. Set PLAYWRIGHT_PATH or NODE_PATH to run them.\n' "$SKIPPED"
[ "$PENDING" = "0" ] || printf '\n!! %s thing(s) are PENDING (a page that is still a placeholder, a check that waits for one): see the PENDING lines above.\n' "$PENDING"

# 3
BUILD=$(unset CLIENT_DIR; node -e "process.env.DATA_DIR = require('fs').mkdtempSync(require('path').join(require('os').tmpdir(), 'sac-build-')); delete process.env.DATABASE_URL; process.env.NODE_NO_WARNINGS = '1'; const S = require('./server.js'); console.log(S.build()); process.exit(0);" 2>/dev/null)
[ -n "$BUILD" ] || stop "the build id could not be worked out."
say "build $BUILD, commit $(git rev-parse --short HEAD)"
if git rev-parse -q --verify refs/tags/deployed >/dev/null; then
  echo "since the last deploy ($(git rev-parse --short deployed)):"
  git --no-pager log --oneline deployed..HEAD
  git --no-pager diff --stat deployed..HEAD | tail -40
  [ -n "$(git rev-list deployed..HEAD)" ] || echo "(nothing: this commit is the one that is deployed)"
else
  echo "(there is no \"deployed\" tag yet: this is the first deploy by this script, so there is nothing to compare with)"
fi
if [ "${1:-}" = "--dry" ]; then say "--dry: stopping here. Nothing was deployed."; exit 0; fi

# 4
say "fly deploy (the release check runs first; the old build keeps running if it fails)"
"$FLY" deploy --ha=false -a "$APP" || stop "fly deploy did not finish. If it stopped at the release command, the check's own lines above say exactly what is wrong, and the machine that was running is still running the old build."

# 5
say "asking the live site"
BAD=""
# (the machine may still be coming up: each address is asked for up to about a minute)
ask() {
  n=0
  while [ "$n" -lt 12 ]; do
    if BODY=$(curl -fsS --max-time 20 "$SITE$1" 2>/dev/null) && printf '%s' "$BODY" | grep -qF -- "$2"; then echo "ok    $1"; return 0; fi
    n=$((n + 1)); sleep 5
  done
  echo "FAIL  $1 (wanted to see: $2)"; BAD="$BAD $1"
}
ask /healthz "\"build\":\"$BUILD\""
ask / "<title>"
ask /make "SAC_BUILD = \"$BUILD\""
ask /api/me "\"build\":\"$BUILD\""
ask /api/templates "\"items\":[{"
if [ -n "$BAD" ]; then
  cat >&2 <<EOF

################################################################################
##  THE DEPLOY WENT OUT AND THE LIVE SITE IS NOT RIGHT:$BAD
##  The "deployed" tag has NOT moved. Makers and the people opening cards may be affected NOW.
##
##  TO GO BACK to the release before (the database needs nothing: the schema only grows,
##  and the songs and videos are in R2, untouched by a deploy):
##    1. find its image:    fly releases -a $APP --image
##    2. its fly.toml:      git show deployed:fly.toml > /tmp/fly.rollback.toml
##                          (no "deployed" tag yet? then there is no release before: fix forward)
##    3. deploy that image: fly deploy --ha=false -a $APP -c /tmp/fly.rollback.toml --image <THE IMAGE FROM 1>
##  Step 2 matters: the old image is deployed with the settings it was tested with, and its own
##  "node server.js --check" runs first, against the database as it is now.
##  Or build the old commit again:  git checkout deployed && ./deploy.sh
##
##  A video that was being made when the machine was replaced is put back in the queue by the
##  machine that starts; nothing is charged twice.
##
##  Then look:  fly logs -a $APP     fly status -a $APP     curl -i $SITE/healthz
################################################################################
EOF
  exit 1
fi

# 6
git tag -f deployed >/dev/null
say "DEPLOYED: build $BUILD is live and answering. The tag \"deployed\" is now $(git rev-parse --short HEAD)."
echo "Pages that were open are told by their next answer from the server, and reload themselves at a moment that costs nobody anything."
