# UTAU DB (CD Manager) 💿

A sleek, self-hosted web application for managing your physical CD collection. Features an automated MusicBrainz scraper, Material 3 design, a dedicated "Wanna Buy" / "Have" workflow, and a mobile-responsive interface.

---

## 🚀 Installation Guide

This application is built to run effortlessly inside a Docker container.

### Option 1: Standard Local Docker Install (Linux / Mac / Windows)

1. Make sure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.
2. Open your terminal and navigate to this folder.
3. Run the following command:
   ```bash
   sudo docker-compose up -d --build
   ```
4. Once the build finishes, open your browser and go to: `http://localhost:3000`

### Option 2: CasaOS / ZimaOS Install

CasaOS makes hosting this app incredibly simple via its web interface.

1. Open your CasaOS / ZimaOS dashboard.
2. Click the **+ Install a customized app** icon (top right of the App store).
3. Fill in the following details in the GUI:
   - **Image**: `node:18-alpine` (Wait, since we are building a custom Dockerfile, the easiest way on CasaOS is to import our `docker-compose.yml` file).
   
   **The Easier CasaOS Method:**
   1. In the "Install a customized app" menu, look for the **Import** icon at the very top right.
   2. Select **Docker Compose** and paste the contents of the `docker-compose.yml` file included in this folder.
   3. CasaOS will automatically fill in the port (`3000`) and the volume mappings (`./data:/app/data`). 
   4. Click **Install**.
   5. Once it finishes, click the new app icon on your dashboard to open it!

---

## ❓ Frequently Asked Questions (FAQ)

**Q: Where is my collection data actually saved?**
**A:** Your CDs are saved in a tiny SQLite database file. Docker safely maps this to the `data/` folder inside this directory on your host machine. As long as you don't delete that folder, your collection is safe even if you rebuild or restart the container!

**Q: How do I backup or restore my database?**
**A:** Open the app, click the **Settings Cogwheel** in the top right, and use the **Export Database (JSON)** button to download a backup. You can use the **Import** button in that same menu to restore a collection on a new machine.

**Q: I searched a catalog number but it says "No CD found". Why?**
**A:** The app searches the open-source *MusicBrainz* database. Ensure you are typing the catalog number exactly as it appears on the spine or disc (for example: `VVCL-1926`). If a CD is extremely obscure or brand new, it might not have been added to MusicBrainz by the community yet.

**Q: Can I run this without Docker?**
**A:** Absolutely. If you have Node.js installed, open a terminal in this folder and run:
```bash
npm install
npm run build
npm start
```
The app will be available at `http://localhost:3000`.

**Q: How do I change the format of an album to Vinyl or DVD?**
**A:** Tap on any CD to open the Details Modal, then tap the Pencil (Edit) icon in the top right. You can select the correct format from the dropdown menu and hit save!
