# MASA IA iPhone app — no Mac of your own

Apple will not let Linux/Xcode-on-this-PC stamp an iPhone app.
You do **not** need to own a Mac. A rented Mac (GitHub Actions) does the stamp.

## What you do on this PC

1. `gh auth login` (one time)
2. In GitHub repo **Settings → Secrets**:
   - `APPLE_TEAM_ID` — 10-character Team ID from developer.apple.com
3. GitHub → Actions → **masa-ia-iphone** → Run workflow
4. Download the `masa-ia-ipa` artifact
5. Put the `.ipa` on the iPhone 14 (Apple Configurator / Xcode on the cloud is already done; install via **AltStore** or **sideload** if you use that, or TestFlight if you set distribution)

The app shell is `ia.masa.app`. It opens `https://kingmlb-1.sole-sidewinder.ts.net` so the globe stays on your server.

Until that first cloud build, the working phone path is still Safari on that URL with Tailscale on.

