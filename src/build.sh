#!/bin/sh
# Builds the standalone page (index.html) from app.html
cd "$(dirname "$0")"
{
  printf '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,minimum-scale=1,user-scalable=no,viewport-fit=cover"><meta name="apple-mobile-web-app-capable" content="yes"><meta name="apple-mobile-web-app-status-bar-style" content="default"><meta name="theme-color" content="#fbfbf9"><meta name="apple-mobile-web-app-title" content="Arrullo"><link rel="apple-touch-icon" href="icon-180.png"><link rel="manifest" href="manifest.webmanifest"><style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px);box-sizing:border-box}*,*:before,*:after{box-sizing:inherit}body{margin:0}[hidden]{display:none!important}</style></head><body>\n'
  cat app.html
  printf '\n</body></html>\n'
} > index.tmp
BUILD=$(date +%Y%m%d%H%M%S)
sed "s/__BUILD__/$BUILD/" index.tmp > index.html && rm index.tmp
printf '{"v":"%s"}\n' "$BUILD" > version.json
# en la rama de trabajo (src/ junto a vendor/): deja la página en la raíz del repositorio
[ -d ../vendor ] && mv index.html version.json .. || true
