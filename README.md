# Freekick

Eigenständige, im Browser spielbare Demo für Freistöße und Eckbälle. Ein Klick, Fingertipp oder Druck auf die Leertaste legt nacheinander Höhe, Richtung und Effet fest; der dritte Schritt startet den Schuss. Die Schusshärte wird über den Regler eingestellt.

Der Ball wird in Metern mit Schwerkraft, seitlicher Effetkraft und Bodenabprall berechnet. Die Toröffnung entspricht 7,32 × 2,44 Metern. Mauer, Pfosten, Latte und Torwart werden während des Flugs geprüft. Die Eckballkamera zeigt den größeren Ausschnitt von der Fahne bis zum Tor.

## Lokal starten

Einen statischen Webserver in diesem Verzeichnis starten, zum Beispiel:

```sh
python -m http.server 4174
```

Danach `http://localhost:4174` öffnen. Die veröffentlichte Demo liegt auf [freekick.cakamper.at](https://freekick.cakamper.at/).

## Blender-Grafik

`render_v2.py` erstellt die hoch aufgelösten Spieler- und Tor-Renderings in `renders-v2/`. `render_animation.py` ergänzt Schuss- und Torwartposen. Die für die Webseite verwendeten PNGs liegen in `assets/`. `blender_assets.py` erzeugt die erste Fassung der Spieler und den Ball.

```sh
blender --background --factory-startup --python render_v2.py
blender --background --factory-startup --python render_animation.py
```

Die Figuren und das Tor sind eigenständige Modelle. Der bereitgestellte Spiel-Screenshot diente nur als Stilreferenz.

Die Physikfälle lassen sich mit `node test-physics.cjs` prüfen.
