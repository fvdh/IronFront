# Grenzen voor de Fun Pass (§2 regel 6)

Status: **VOORSTEL** (2026-10-06), nog niet bevroren. Wordt bevroren na akkoord van de opdrachtgever, vóór fase 22. Daarna wijzigt in 1.4 niets meer; een afwijking is een bevinding.
Basis: nulmeting `1.3.0+2f1b3f7d` (`2026-10-06-nulmeting-samenvatting.md`).

## 1. Doelgrenzen (wanneer een probleem opgelost is)

| Onderwerp | Metriek | Grens | Basiswaarde 1.3.0 | Bron |
|---|---|---|---|---|
| Factiebalans | Winrate niet-spiegel, puntschatting, land en zee | 40–60% | Land 61 / 50 / 39%; zee 56 / 25 / 69% | Beslissing 21 |
| Kosteneffectiviteit | Gemiddelde in eigen rol (duelmatrix) | 0,8–1,25, of een vastgelegde reden | `nul-duels` | Balansplan, uitgangspunt 2 |
| Comeback (AI) | % potjes gewonnen na ≥ 40% achterstand | ≥ 15% | 17% land, 31% zee | Fase 27 |
| Superwapen, kernsignaal | Bak `gelijk`, n ≥ 15 | ≤ 10% | onbeslist (n = 1) | Fase 24 |
| Superwapen, aandeel | In vernietigde/overgenomen waarde | ≤ 10% | 0–0,4% | Fase 24 |
| Superwapen, overwinst | Per bak | ≤ 10 pp | onbeslist | Fase 24 |
| Factiebalans met/zonder superwapens | Verschil in winrate | ≤ 5 pp | ≤ 3 pp (land), 0 (zee) | Fase 24 |
| Beslissend gevecht na 15 min | % potjes | ≤ 25% | 1% land, 0% zee | Fase 24 |
| Legerconcentratie na 15 min | Mediaan | ≤ 60% | 80% (n = 2, onbeslist) | Fase 24 |
| Patstellingen | % potjes in de meetset | ≤ 2% | 0% land/zee, 4% Normal-medium | Fase 23 (E1) |
| Niveaus | Hard wint van Normal, Normal van Easy | ≥ 60% | nog niet gemeten | Fase 26 |

## 2. Alarmgrenzen (bovenaan elk rapport)

**Voorstel:** een alarmbel gaat af als een metriek **buiten de interkwartielafstand (Q1–Q3) van de nulmeting** valt, aan de slechte kant. Dat is een grens uit de data zelf, niet verzonnen. Verder geldt de doelgrens hierboven, als die er is.

| Signaal | Slechte kant | Nulmeting land: mediaan (Q1–Q3) |
|---|---|---|
| Keuze-idle midgame (unit-wachtrijen) | hoger | 8% (4–14%) |
| Tijd zonder beslissing ≥ 30 s | hoger | 33% (28–44%) |
| Dominante eenheid | hoger | 69% (62–78%) |
| Tijd tot eerste strategische keuze | later | 3,1 min (2,7–3,5) |
| Comeback | lager | 17% → doelgrens 15% |
| Patstellingen | hoger | 0% → doelgrens 2% |

Voor mensen (fase 21) gelden geen AI-alarmgrenzen. Daar zijn de streefwaarden van fase 27 de maat; die worden na ronde 1 ingevuld.

## 3. Ijking verliesclassificatie (op `nul-normal-medium`, doel: elke oorzaak in 10–60% van de verloren potjes)

| Code | Hoofdgetal | Oud | Voorstel | Aanslaan op 26 verloren potjes | Opmerking |
|---|---|---|---|---|---|
| PB | productie-uptime | < 50% | **< 30%** | 26 → 14 (54%) | Bij 25% wordt het 7 (27%); 30% is de waarde in de band die het dichtst bij het origineel ligt |
| BG | verlies in één gevecht | ≥ 50% | **≥ 90%** | 16 → 15 (58%) | Het getal maakt weinig uit: beslissende gevechten wissen bijna altijd het hele leger uit |
| ES | inkomensdaling | ≥ 40% | 40% (blijft) | 26 → 7 (27%) | **Regelwijziging, geen getal:** alleen verliezen tot het kantelpunt K tellen. Anders slaat ES altijd aan, omdat de basis aan het eind valt. Verder ongevoelig voor het getal |
| EU, SW, OV, VA | – | – | blijven | 0 (OV 1, VA 0) | Komen in AI-potjes niet voor bij geen enkele waarde (de AI breidt niet uit en haalt geen superwapen af). Bevinding; niet oprekken |
| SC | aandeel één klasse | ≥ 60% | blijft | 2 (8%) | Net onder de band en ongevoelig voor het getal |

Resultaat: X (geen oorzaak) in 3 van 26 potjes (12%), dus onder de grens van 1 op 4.

## 4. Definitie "eerste uitbreiding" (20.2-C)

**Probleem:** het startveld is nu één veld: het veld waarvan het midden het dichtst bij de start ligt. Ligt de basis tussen twee velden (Islands, soms small), dan telt de eerste raffinaderij als uitbreiding (0,5 min).
**Voorstel:** startvelden = alle velden waarvan het midden binnen **10 tegels** van de start ligt. Een uitbreiding is een raffinaderij of CY die het dichtst bij een ander veld staat. De bouwradius rond een CY is ±8–12 tegels, dus binnen 10 tegels is "in de basis".
