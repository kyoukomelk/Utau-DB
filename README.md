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

Since this app builds a custom Docker image specifically for you, you'll need to download the code to your server first before importing it into CasaOS.

**Step 1: Download and Build the repository**
1. SSH into your CasaOS/ZimaOS server (or open the built-in terminal).
2. Navigate to where you keep your app data (usually `/DATA/AppData/` on CasaOS):
   ```bash
   cd /DATA/AppData/
   ```
3. Clone this repository into a new folder and go into it:
   ```bash
   git clone https://github.com/kyoukomelk/Utau-DB.git cd-manager
   cd cd-manager
   ```
4. Build the custom Docker image locally by running this command:
   ```bash
   sudo docker build -t cd-manager:latest .
   ```

**Step 2: Install via CasaOS UI**
1. Open your CasaOS / ZimaOS dashboard in your web browser.
2. Click the **+ Install a customized app** icon (top right of the App store).
3. Look for the **Import** icon at the very top right of the install window.
4. Select **Docker Compose** and paste the exact contents of the `docker-compose.yml` file from the repository you just cloned.
5. CasaOS will automatically fill in all the correct fields (including the Image, Tag, and Volumes mapping directly to your current folder).
6. Click **Install**. CasaOS will use the image you built in Step 1 and launch it!
7. Once it finishes, click the new app icon on your dashboard to open your CD Manager!

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
