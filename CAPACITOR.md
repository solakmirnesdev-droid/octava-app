# Nativna ljuska (Capacitor)

Priprema je u kodu i provjerena. Ovdje stoji **šta ostaje** kad se stvarno
odlučiš praviti aplikaciju, uključujući ono za šta nema zaobilaznice.

## Šta već radi

```bash
npm run build                     # sajt, server-rendered — nepromijenjen
NUXT_PUBLIC_API_BASE=https://api.example/api npm run build:native
```

Nativni build daje `.output/public/`, na šta `capacitor.config.ts` već pokazuje.
Bez apsolutnog `NUXT_PUBLIC_API_BASE` build **odbija da se izvrši** umjesto da
napravi paket koji ne može dohvatiti ništa.

Prijava nativno ide na **bearer token** umjesto na kolačić — API to već prima
(`readToken` čita `Authorization` pa tek onda kolačić), pa backend nije mijenjan.
Na webu se ništa nije promijenilo: kolačić ostaje, token se nigdje ne piše.

## Koraci kad kreneš

1. `npm i -D @capacitor/cli && npm i @capacitor/core`
2. `npx cap add ios` i/ili `npx cap add android` (traže Xcode / Android SDK)
3. `npm run build:native && npx cap sync`

## Što se mora podesiti, inače ne radi

**CORS.** Ljuska ima svoj origin i API ga nikad nije vidio. Dodaj u backendov
`CORS_ORIGIN`: `capacitor://localhost` (iOS) i `https://localhost` (Android, uz
`androidScheme: 'https'` kako je već postavljeno). Bez toga svaki zahtjev pada
prije nego bude pročitan.

**Dozvola za mikrofon.** Štimer i prepoznavanje traže `getUserMedia`, a WebView
je ne dobija sam:
- iOS: `NSMicrophoneUsageDescription` u `Info.plist`
- Android: `RECORD_AUDIO` u `AndroidManifest.xml`

## Što neće raditi, i to nije popravka od pet minuta

**Google prijava.** `GoogleSignIn.vue` koristi Google Identity Services, a
Google **blokira OAuth u ugrađenim WebViewima** — namjerno, protiv krađe
lozinki. Nativno traži `@codetrix-studio/capacitor-google-auth` ili sličan
nativni plugin, što je zaseban tok prijave, ne ista komponenta. Dok se to ne
uradi, u aplikaciji radi samo prijava emailom.

**Turnstile.** Cloudflareov widget je pravljen za pretraživač. Registracija ga
koristi; ponašanje u WebViewu treba provjeriti prije nego se osloniš na njega.

## Sitnije, ali će se primijetiti

- **Deep linkovi** — dijeljena veza na pjesmu otvara pretraživač, ne aplikaciju,
  dok se ne podese Universal Links (iOS) i App Links (Android).
- **`nuxt-og-image`** nema smisla u aplikaciji; bezopasno je, samo mrtav teret.
- **Safe area** je riješena za `body` i `.sticky`; ostalo provjeri na uređaju s
  zarezom, ne u simulatoru na desktopu.
