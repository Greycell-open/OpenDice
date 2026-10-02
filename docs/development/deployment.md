# Website Deployment

Open Dice is a static Vite website.

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
```

Deploy this folder to any static host. It is live at https://greycell.app/run/open-dice/:

```txt
apps/web/dist/
```

The root `website.json` records the source app, build command, and output directory for deployment scripts.

## Notes

- The site has no backend requirement.
- The dice engine and notation parser are bundled into the web app.
- 3D printable model sources remain in the repository and are linked/documented, not generated at runtime.
