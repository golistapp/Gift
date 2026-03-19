# QR Memory Gift

A personalized digital surprise web application. Users create a romantic "memory gift" — protected by a 6-digit passcode — accessible via QR code.

## Features

- **Surprise Vault**: Locked screen requiring a 6-digit passcode
- **Love Letter**: Animated letter that fades in on unlock
- **Love Booth**: Photo editor with frames for up to 5 memories
- **Secret Chat Room**: AES-encrypted real-time chat
- **Admin Dashboard**: Manage orders, generate Memory IDs, create QR codes
- **Form**: Creator interface for uploading photos and writing messages

## Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (no build tools)
- **Storage**: Firebase Realtime Database
- **Image Hosting**: ImageKit.io
- **Libraries**: CryptoJS (AES encryption), QRCode.js, browser-image-compression (all via CDN)

## Project Structure

```
index.html          # Main viewer (recipient's view)
app.js              # Main application logic
components.js       # Reusable HTML components/templates
global.css          # Shared styles
gift.mp3            # Background music
server.js           # Static file server (Node.js, port 5000)
api/
  firebase.config.js    # Firebase credentials & init
  imagekit.config.js    # ImageKit API config
admin/
  index.html        # Admin dashboard
  login.html        # Admin login
  admin.js          # Dashboard logic
  style.css         # Admin styles
form/
  form.html         # Gift creation form
  form.js           # Form logic
```

## Running the App

The app is served by a simple Node.js static file server on port 5000.

```bash
node server.js
```

## Configuration

- Firebase credentials are in `api/firebase.config.js`
- ImageKit credentials are in `api/imagekit.config.js`
- No environment variables required (credentials are embedded in JS files)

## Deployment

Configured for autoscale deployment running `node server.js`.
