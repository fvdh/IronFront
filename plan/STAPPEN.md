# Stappenplan: van nu naar 1.4

Laatst bijgewerkt: 2026-10-02. Dit is het startpunt om het werk later weer op te pakken. De details staan in de plannen; hier staat alleen **wat**, **in welke volgorde** en **waar het staat**.

## Plannen

| Bestand | Wat |
|---|---|
| `plan/balans-plan.md` | Balansronde 1 (units). B1–B4 zijn uitgevoerd in de code. Wordt **1.3.0**. |
| `plan/fun-pass-plan.md` | Verbeterplan **1.4 "Fun Pass"** (fases 20–27), versie 4. |
| `plan/fun-pass-fun-audit.md` | Bijlage: fun-audit per fase van een potje. |
| `plan/fun-pass-verliesclassificatie.md` | Bijlage: objectieve "waarom verloor ik?". |
| `IRON-FRONT-ONTWERP.md` | Ontwerpdocument van v1.2.0 (achtergrond, geen plan). |

## Genomen besluiten

- **Volgorde:** eerst de balansronde afronden als 1.3.0, daarna de Fun Pass als 1.4. Niet tegelijk.
- **Open balanspunten** (lucht, Lash Tank, Anvil, zeebalans, Delirium Drone) worden **niet** meer in 1.3.0 opgelost. Ze gaan naar het menu BL in de Fun Pass (BL1–BL5).
- **Verder balanceren na 1.3.0** gebeurt in dezelfde meetrij als de andere Fun Pass-wijzigingen: steeds één wijziging, en dan opnieuw meten.

## Stappen

### Stap 0: voorbereiding (nu)
- [ ] De plannen laten checken.
- [x] Beslissingen nemen die "Nu" moeten (fun-pass-plan §4): _genomen 2026-10-02, alle voorstellen_
  - 5: feature freeze
  - 6: touch bevriezen
  - 17: releaseregel
  - 18: versienummers 1.3.0 / 1.4
  - 21: definitie van factiebalans
- [x] Git-repository aangemaakt _(2026-10-06, `github.com/fvdh/IronFront`)_; `build` = versie + commit-hash.

### Stap 1: balansronde afronden → 1.3.0
- [x] Speeltest B5 zelf spelen _(2026-10-06)_ (zie de speeltestlijst onderaan `balans-plan.md`).
- [ ] Alleen fouten uit de speeltest herstellen; open balanspunten blijven voor menu BL.
- [x] `package.json` naar 1.3.0, CHANGELOG bijgewerkt _(2026-10-06; geen git, dus geen tag)_.

### Stap 2: Fun Pass fase 20, meetinstrumenten en nulmeting
- [x] Telemetrie, kruising factie × kaart in de balanstool, zeematrix, tijdlijnweergave en classificatiescript bouwen. _(2026-10-02)_
- [x] Nulmeting op 1.3.0 gedraaid _(2026-10-06)_.
- [x] Alarm- en doelgrenzen bevroren in `docs/metingen/grenzen.md` _(2026-10-06)_, inclusief ijking verliesclassificatie en definitie uitbreiding; rapporten herberekend.
- [x] Telemetrie aangevuld vóór `playtest-r1`: rig-inkomen, gratis eenheden, harassment-kosten _(2026-10-06)_.
- [ ] **Parallel:**
  - testers en beoordelaars werven (beslissing 11);
  - akkoord geven op de definitie van "leuk", de fun-audit en de verliesclassificatie, en die bevriezen (beslissing 12).

### Stap 3: twee sporen naast elkaar
- [ ] **Spoor A:** fase 21, playtest-ronde 1, op build `playtest-r1` (1.3.0 met telemetrie, zonder AI-wijzigingen).
- [x] **Spoor B:** 26.A (AI-geheugen en exploit-fix) in branch `fase-26a`, referentiemeting `ref-26a` gedraaid _(2026-10-06, `docs/metingen/2026-10-06-ref-26a-samenvatting.md`)_. Gemerged in `main` (2026-10-06); `playtest-r1` hoort op commit `b573c46` (vóór 26.A).
- [ ] Na ronde 1: de streefwaarden voor fase 27 invullen en bevriezen (beslissing 13).

### Stap 4: fase 22, ontwerpkern en schrapronde
- [ ] Kernzin, factiezinnen, Psi-richting en schraplijst vaststellen (beslissingen 1–4 en 9).
- [ ] De geschrapte eenheden uitzetten en opnieuw meten.

### Stap 5: fases 23–26 en menu BL, één wijziging tegelijk
- [ ] Per fase en per menu-optie bepalen of hij start, krimpt of vervalt, en de volgorde van de meetrij vastleggen (beslissing 15).
- [ ] Per iteratie één interventie (E, S/D, A of BL), en dan opnieuw meten tegen `ref-26a`.
- [ ] Start fase 23, dan eerst de AI-uitbreidingsregel (E6), daarna de vergelijking met alleen de economie als verschil.
- [ ] Fase 25 (tutorial, nabespreking, uitleg) mag parallel gebouwd worden; het effect wordt gemeten in ronde 2.

### Stap 6: fase 27, afronding → 1.4
- [ ] Playtest-ronde 2 met minstens 10 nieuwe testers.
- [ ] Vergelijking 1.3.0 → `ref-26a` → 1.4.
- [ ] Definitief schrappen, documentatie bijwerken (ook `IRON-FRONT-ONTWERP.md`) en release volgens de releaseregel.

## Waar we nu staan

Stap 0 is klaar. Van stap 2 zijn de meetinstrumenten van fase 20 gebouwd (zie `docs/TODO.md`). Stap 1 is klaar: 1.3.0 is uit (2026-10-06). De nulmeting is gedraaid (`docs/metingen/2026-10-06-nulmeting-samenvatting.md`). De grenzen zijn bevroren (`docs/metingen/grenzen.md`). Volgende: stap 3 (playtest-ronde 1 en 26.A).
