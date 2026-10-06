#!/usr/bin/env bash
# Fun Pass 20.6: the baseline ("nulmeting") on 1.3.0, all runs of the table in plan/fun-pass-plan.md.
# Usage: tools/nulmeting.sh [prefix]   (prefix default "nul"; use e.g. "ref-26a" for the reference run after 26.A)
# Writes docs/metingen/<date>-<prefix>-*.md/.json and docs/balans/<prefix>-duels*.md/.csv.
set -euo pipefail
cd "$(dirname "$0")/.."
P=${1:-nul}
D=$(date +%F)
LAND="BALANCE_MAPS=plains,rivers,highlands BALANCE_SEEDS=3"
SEA="BALANCE_MAPS=coast,islands BALANCE_SEEDS=2"

run() { # label, env...
  local label=$1; shift
  echo "== $label"
  env "$@" BALANCE=all BALANCE_RAW=1 BALANCE_REPORT="$label" npx vitest run balance.test --silent >/dev/null
}

# Control runs without superweapons first: the runs with superweapons use them for the over-win (20.2-D).
run "$P-nosw-land" $LAND BALANCE_NOSW=1
run "$P-nosw-zee" $SEA BALANCE_NOSW=1
run "$P-land" $LAND BALANCE_CONTROL="docs/metingen/$D-$P-nosw-land.json"
run "$P-zee" $SEA BALANCE_CONTROL="docs/metingen/$D-$P-nosw-zee.json"
run "$P-normal-medium" $LAND BALANCE_SEEDS=1 BALANCE_SIZE=medium BALANCE_DIFF=normal,normal
# The ore harness must be neutral: identical to the runs above.
run "$P-ore-v12-land" $LAND BALANCE_ORE=v12
run "$P-ore-v12-zee" $SEA BALANCE_ORE=v12
for x in land zee; do
  COMPARE="docs/metingen/$D-$P-$x.json,docs/metingen/$D-$P-ore-v12-$x.json" npx vitest run balance.test --silent >/dev/null
done
# Scenarios, duel matrices.
REGRESS=1 REGRESS_OUT="$P-scenarios" npx vitest run duels --silent >/dev/null
DUELS=1 DUELS_OUT="$P-duels" npx vitest run duels --silent >/dev/null
DUELS=1 DUELS_SEA=1 DUELS_OUT="$P-duels-zee" npx vitest run duels --silent >/dev/null
echo "done: docs/metingen/$D-$P-* and docs/balans/$P-duels*"
