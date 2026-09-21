# Freekick

Eigenständige, im Browser spielbare Demo für Freistöße und Eckbälle. Zielrichtung, Schusshärte und Effet lassen sich mit Maus, Tastatur oder Touch steuern.

## Lokal starten

Einen statischen Webserver in diesem Verzeichnis starten, zum Beispiel:

```sh
python -m http.server 4174
```

Danach `http://localhost:4174` öffnen. Die veröffentlichte Demo liegt auf [freekick.cakamper.at](https://freekick.cakamper.at/).

## Blender-Grafik

`render_v2.py` erstellt die hoch aufgelösten Spieler- und Tor-Renderings in `renders-v2/`. Die für die Webseite verwendeten PNGs liegen in `assets/`. `blender_assets.py` erzeugt die erste Fassung der Spieler und den Ball.

```sh
blender --background --factory-startup --python render_v2.py
```

Die Figuren und das Tor sind eigenständige Modelle. Der bereitgestellte Spiel-Screenshot diente nur als Stilreferenz.
