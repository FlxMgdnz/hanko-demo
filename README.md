# Mein Portal – Hanko Demo

Eine kleine deutschsprachige Anwendung mit Vite, JavaScript und CSS. Hanko Cloud übernimmt die Authentifizierung. Es gibt keinen eigenen Server und keine Datenbank.

## Lokal starten

Voraussetzung: Node.js 24 und npm.

```sh
npm ci
npm run dev
```

Öffne http://localhost:5173. Der Port ist fest eingestellt, damit die Origin mit der Hanko-Konfiguration übereinstimmt.

```sh
npm run build
npm run preview
```

Der Produktionsbuild liegt in `dist/`. Eine Preview auf einem anderen Port benötigt ebenfalls eine passende Hanko-Origin.

## Hanko konfigurieren

Die öffentliche Projekt-API-URL steht in `.env`. Sie ist kein Geheimnis und wird im Frontend verwendet. Für ein anderes Projekt kann sie in der ignorierten Datei `.env.local` überschrieben werden. Niemals Admin-API-Keys oder andere Geheimnisse in `VITE_*`-Variablen speichern.

Im Hanko-Cloud-Projekt:

1. Für lokale Entwicklung die App-URL `http://localhost:5173` und die dazu passende erlaubte Origin konfigurieren.
2. Gewünschte Verfahren wie E-Mail-Code und Passkeys aktivieren; E-Mail-Versand prüfen.
3. Optional Benutzername bei der Registrierung aktivieren. Die Begrüßung verwendet den Hanko-Benutzernamen, sonst die primäre E-Mail-Adresse.
4. Für GitHub Pages die tatsächliche App-URL hinterlegen, z. B. `https://USERNAME.github.io/REPOSITORY/`. Die Origin ist `https://USERNAME.github.io` (ohne Repository-Pfad). Passkey/Relying-Party-Einstellungen müssen zur Domain passen. Passkeys für localhost sind nicht automatisch auf der veröffentlichten Domain gültig.
5. Für lokale Entwicklung und Veröffentlichung vorzugsweise getrennte Hanko-Projekte verwenden. Alle Hanko-Elemente und der SDK-Sprachparameter sind auf Deutsch eingestellt; gegebenenfalls deutsche E-Mail-Vorlagen im Projekt prüfen.

## Seiten

- `/#/login`: Login mit Hanko Login Element
- `/#/registrieren`: Registrierung mit Hanko Registration Element
- `/#/dashboard`: Begrüßung und drei exemplarische Anträge
- `/#/profil`: Hanko Profile Element

Dashboard und Profil prüfen die Sitzung über Hanko. Anmeldung führt zum Dashboard, Ausloggen zum Login. Das Menü lässt sich mit Escape schließen. Hash-Routing und relative Asset-Pfade ermöglichen Direktlinks und Neuladen auch unter dem GitHub-Repository-Unterpfad.

Die Demo-Anträge sind statische, öffentlich abrufbare Beispieldaten. Eine Zugriffskontrolle im Frontend schützt keine vertraulichen Daten. Echte Anträge benötigen eine API, die Hanko-Sitzungen und Zugriffsrechte serverseitig prüft.

## GitHub Pages

1. Ein öffentliches GitHub-Repository erstellen und dieses lokale Repository dorthin pushen (Branch `main`).
2. Unter **Settings → Pages → Build and deployment → Source** die Option **GitHub Actions** auswählen.
3. Der Workflow `.github/workflows/deploy.yml` baut und veröffentlicht bei Pushes auf `main`. Er lässt sich auch manuell starten.
4. Die finale URL in Hanko konfigurieren und die produktive Hanko-API-URL bei Bedarf in `.env` aktualisieren.

Repository: https://github.com/FlxMgdnz/hanko-demo. Der Deployment-Workflow ist vorbereitet; GitHub Pages muss vor dem ersten Deployment wie oben beschrieben aktiviert werden.

## Funktionsprüfung mit einem Testkonto

`npm test` prüft den Router mit einer simulierten Hanko-Schnittstelle (Routenschutz, Fehlerfälle, HTML-Escaping und konkurrierende Navigation). Das ersetzt keinen vollständigen Test der echten Anmeldung.

- Registrierung, E-Mail-Verifizierung und gegebenenfalls Passkey-Einrichtung abschließen.
- Begrüßung auf dem Dashboard prüfen; im Menü Profil öffnen.
- Profiländerung durchführen und zum Dashboard zurückkehren.
- Seite auf Dashboard/Profil neu laden; gültige Sitzung muss erhalten bleiben.
- Ausloggen; geschützte Direktlinks müssen zum Login führen.
- Sitzung in einem zweiten Tab beenden; der erste Tab muss reagieren.
- Auf schmalem Bildschirm sowie mit Tastatur navigieren.

E-Mail-Verifizierung und Passkey-Dialoge erfordern ein echtes Testkonto bzw. ein geeignetes Gerät und müssen beim Einrichten des Hanko-Projekts abschließend geprüft werden.

## Prüfstand der Erstimplementierung

- Produktionsbuild und sieben automatisierte Tests erfolgreich.
- Nach Freigabe von `http://localhost:5173` am 18.11.2026 im Browser geprüft: Login und Registrierung laden auf Deutsch, der Login bietet E-Mail und Passkey an. Ein anonymer Direktaufruf des Dashboards führt zum Login. Die vollständige Anmeldung mit E-Mail-Verifizierung bzw. Passkey und die authentifizierten Seiten müssen noch mit einem echten Testkonto geprüft werden.
- `npm audit --omit=dev`: keine gemeldeten Sicherheitslücken. Der vollständige Audit meldet vier zusammenhängende High-Einträge im Vite-Build-Abhängigkeitsbaum durch `picomatch` (GHSA-fc5q-39xc-vjpf). Die aktuell verfügbare Version 4.0.7 ist betroffen. Kein erzwungenes Downgrade auf eine alte Vite-Version vorgenommen; nach Bereitstellung eines Fixes aktualisieren. Diese Pakete werden nicht in die statische Website ausgeliefert.
