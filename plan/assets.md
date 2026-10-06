# Assetbeleid — Browser RTS

## Doel
Deze game gebruikt een eigen, consistente retro-isometrische visuele stijl die de leesbaarheid en sfeer van klassieke RTS-games benadert. De game mag niet afhankelijk zijn van onrechtmatig verkregen of verspreide assets uit Command & Conquer: Red Alert 2 – Yuri's Revenge.

## Voorkeursbronnen

### 1. Eigen gegenereerde assets (primaire bron)
Gebruik AI-gegenereerde of handgemaakte assets die specifiek voor dit project zijn gemaakt. Houd één vastgelegde art direction aan:
- Retro-isometrische RTS, bij voorkeur 2:1-projectie.
- Consistente schaal, lichtbron, contouren, detaillering en kleurpalet.
- Transparante PNG's voor sprites; tiles mogen waar passend opaque zijn.
- Teamkleuren als verwisselbare overlays of palettes, niet ingebakken in gedeelde bronbestanden waar dat vermijdbaar is.
- Maak eerst een goedgekeurde referentieset (infanterist, voertuig, gebouw, terrein-tileset) en gebruik die als stijlanker voor nieuwe assets.
- Genereer geen assets die bestaande C&C-sprites, logo's, personages of exacte ontwerpen nabootsen.

AI-gegenereerde assets moeten vóór opname worden gecontroleerd op visuele consistentie, transparantie, bruikbaarheid, artefacten en eventuele rechten-/licentievoorwaarden van de gebruikte generator.

### 2. Open licentie-assets (aanvullende bron)
Gebruik waar nuttig assets van:
- Kenney: https://kenney.nl/assets
- OpenGameArt: https://opengameart.org/
- itch.io Game Assets: https://itch.io/game-assets
- CraftPix: https://craftpix.net/

Deze sites zijn vindplaatsen, geen algemene licentieverlening. Controleer voor ieder afzonderlijk pakket de licentie, commerciële gebruiksrechten, attributievereisten, wijzigingsrechten en eventuele beperkingen. Neem geen asset op wanneer de herkomst of licentie onduidelijk is.

### 3. OpenRA (technische referentie)
Gebruik OpenRA als inspiratie en technische referentie voor klassieke RTS-systemen en bestands-/animatieconcepten:
- Website: https://www.openra.net/
- Broncode: https://github.com/OpenRA/OpenRA

OpenRA is geen automatische toestemming om alle bijbehorende game-assets te hergebruiken. Controleer de licentie van code, mods en assets afzonderlijk. Gebruik de originele C&C-assets niet in een distributiebuild zonder passende rechten.

## Verboden of niet-toegestane aannames
- Ga er niet van uit dat assets die online te vinden zijn vrij te gebruiken zijn.
- Rip, scrape, extract of distribueer geen originele EA-game-assets voor de publieke build zonder expliciete toestemming of aantoonbaar toepasselijke rechten.
- Gebruik geen originele muziek, stemmen, geluidseffecten, logo's, campagne-afbeeldingen of herkenbare personageportretten zonder rechten.
- Verzin geen licentie-informatie. Bij twijfel: asset niet opnemen en een alternatief maken.
- Gebruik geen emoji of willekeurige tekens als definitieve game-art.

## Assetinventaris en administratie
Maak `docs/asset-register.md` (of `assets/ASSET_REGISTER.md`) met per asset:
- Asset-ID en beschrijving.
- Bestandslocatie.
- Maker/bron-URL.
- Licentie en datum waarop deze is gecontroleerd.
- Vereiste attributie.
- Bewerkingen die zijn uitgevoerd.
- Status: placeholder, in review, goedgekeurd of vervangen.

Bewaar licentieteksten en vereiste credits bij de asset of in `assets/licenses/`. Neem bij externe pakketten waar mogelijk de originele licentiebestanden mee.

## Aanbevolen projectstructuur
```text
public/assets/
  sprites/
    units/
      allies/
      soviets/
      yuri/
    buildings/
      allies/
      soviets/
      yuri/
    terrain/
    effects/
    ui/
  audio/
    music/
    sfx/
  fonts/
  licenses/
docs/
  art-direction.md
  asset-register.md
```

## Sprite- en animatiestandaarden
Leg per asset vast:
- Bronafmetingen en weergaveschaal.
- Isometrische richting(en).
- Frame-afmetingen, framevolgorde en frames per seconde.
- Pivot/anker en voetpunt.
- Collision- en selectiegeometrie.
- Schaduwbeleid.
- Teamkleurondersteuning.
- Transparantie en bestandsformaat.

Gebruik een centrale assetmanifest/AssetManager. Gameplaycode verwijst naar stabiele asset-ID's, nooit rechtstreeks naar willekeurige bestandspaden. Ontbrekende assets moeten een herkenbare placeholder tonen en een ontwikkelwaarschuwing geven, zonder de game te laten crashen.

## Fallbackbeleid
Als een geschikte asset niet beschikbaar is:
1. Maak een eenvoudige eigen placeholder in dezelfde art direction.
2. Registreer deze als placeholder.
3. Houd de gameplay volledig functioneel.
4. Vervang de placeholder later zonder gameplaycode te wijzigen.

## Releasecontrole
Voor iedere release:
- Controleer dat alle gebruikte assets in het register staan.
- Controleer licenties en attributies.
- Verwijder ongebruikte of niet-goedgekeurde bestanden uit de distributie.
- Controleer transparantie, schaal, animatie en visuele consistentie.
- Vermeld vereiste credits in de game of bijbehorende documentatie.
