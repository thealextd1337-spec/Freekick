# Freekick

Eigenständige, im Browser spielbare Demo für Freistöße und Eckbälle. Ein Klick, Fingertipp oder Druck auf die Leertaste legt nacheinander Höhe, Richtung und Effet fest; der dritte Schritt startet den Schuss. Die Schusshärte wird über den Regler eingestellt.

Der Ball wird in Metern mit Schwerkraft und seitlicher Effetkraft berechnet. Niedrige Schüsse und gelandete Bälle rollen mit Reibung auf dem Rasen. Die Toröffnung entspricht 7,32 × 2,44 Metern. Pfosten und Latte sind runde Kollisionskörper; Abpraller werden weiter simuliert und ein Tor zählt erst, wenn der ganze Ball die Linie überschritten hat. Im Tor bremst das Netz den Ball. Mauer und Torwart werden während des Flugs geprüft.

Die Steuerung liegt als Overlay im Spielfeld. Die Kamera passt sich Hoch- und Querformat an und rückt während des Schusses näher ans Tor. Der Ball wird zur besseren Erkennbarkeit größer gezeichnet, ohne seinen physikalischen Radius zu ändern. Der Vollbildknopf verwendet die echte Fullscreen API und zeigt bei fehlender Browserunterstützung einen Hinweis zur Installation als App auf dem Home-Bildschirm. Das Web-App-Manifest öffnet die installierte Demo ohne normale Browserleiste, soweit die Plattform dies unterstützt.

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
