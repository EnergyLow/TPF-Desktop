# TPF Studio — Electron Desktop App

Десктопное приложение для Windows, повторяющее одностраничный сайт TPF Studio.

## Стек

- Electron
- Vanilla HTML / CSS / JS
- Без React/Vue, без бэкенда
- Все ассеты локальные
- Внешние ссылки открываются через `shell.openExternal`
- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`

## Установка и запуск

```bash
npm install
npm start