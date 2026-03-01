# HoneyBlock - Tutorial for Dummies

A step-by-step guide to deploying HoneyBlock on a fresh Ubuntu server.

## What is HoneyBlock?

HoneyBlock sets up a fake SSH server (honeypot) on your machine. When hackers try to break in, it logs everything they do and shows it on a web dashboard. You can also block their IPs with one click.

## Requirements

- A machine running **Ubuntu 20.04 or newer** (a cheap VPS works great)
- **Root access** (sudo)
- An internet connection (for downloading packages)

## Option A: Quick Install (Recommended)

### Step 1: Download the installer

Download `honeyblock-installer.run` from the GitHub releases page:

```bash
wget https://github.com/YOUR_USERNAME/honeyblock/releases/download/v1.0.0/honeyblock-installer.run
```

### Step 2: Run the installer

```bash
sudo bash honeyblock-installer.run
```

That's it. Wait for it to finish. When you see "HoneyBlock installed successfully!", everything is running.

### Step 3: Open the dashboard

Open your browser and go to:

```
http://YOUR_SERVER_IP:5000
```

If you're on the machine itself, use `http://localhost:5000`.

### Step 4: Test it

Open a new terminal and SSH into the honeypot:

```bash
ssh root@localhost -p 2222
```

Type `yes` when asked about the fingerprint, then enter any password (it accepts anything — it's a trap!). You'll land in a fake shell. Type `exit` to leave.

Refresh the dashboard. Your "attack" should appear.

---

## Option B: Build From Source

Use this if you want to modify the code or build your own installer.

### Step 1: Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/honeyblock.git
cd honeyblock
```

### Step 2: Install Node.js (needed to build the frontend)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 3: Install frontend dependencies

```bash
cd frontend
npm install
cd ..
```

### Step 4: Build the installer

```bash
sudo apt-get install -y makeself rsync
bash build.sh
```

This creates `honeyblock-installer.run`.

### Step 5: Run the installer

```bash
sudo bash honeyblock-installer.run
```

---

## How It Works

```
Hacker tries SSH (port 2222)
        |
        v
   [ Cowrie Honeypot ]  ──logs to──>  cowrie.json
                                          |
                                          v
                                  [ Log Watcher ]  ──parses & stores──>  SQLite DB
                                                                            |
                                                                            v
                                                                    [ Flask API ]
                                                                            |
                                                                            v
                                                                  [ Web Dashboard ]
                                                                  (localhost:5000)
```

Three services run in the background:

| Service | What it does |
|---------|-------------|
| `cowrie` | The fake SSH server that hackers connect to |
| `honeyblock` | The web dashboard and API (port 5000) |
| `honeyblock-watcher` | Reads Cowrie's logs and saves them to the database |

---

## Useful Commands

### Check if everything is running

```bash
sudo systemctl status cowrie
sudo systemctl status honeyblock
sudo systemctl status honeyblock-watcher
```

All three should say `active (running)`.

### Restart a service

```bash
sudo systemctl restart cowrie
sudo systemctl restart honeyblock
sudo systemctl restart honeyblock-watcher
```

### View live logs

```bash
# Cowrie (see hacker connections in real time)
sudo journalctl -u cowrie -f

# Log watcher
sudo tail -f /opt/honeyblock/logs/watcher.log

# Dashboard API
sudo journalctl -u honeyblock -f
```

### Stop everything

```bash
sudo systemctl stop cowrie honeyblock honeyblock-watcher
```

### Uninstall

```bash
sudo systemctl stop cowrie honeyblock honeyblock-watcher
sudo systemctl disable cowrie honeyblock honeyblock-watcher
sudo rm /etc/systemd/system/cowrie.service
sudo rm /etc/systemd/system/honeyblock.service
sudo rm /etc/systemd/system/honeyblock-watcher.service
sudo rm -rf /opt/honeyblock
sudo userdel -r cowrie
sudo systemctl daemon-reload
```

---

## FAQ

**Q: Can hackers break into my real machine through Cowrie?**
No. Cowrie is a sandbox. Hackers interact with a completely fake system. They cannot access your real files or run real commands.

**Q: What port does Cowrie listen on?**
Port 2222 by default. Your real SSH stays on port 22.

**Q: Can I expose it to the internet?**
Yes, that's the whole point! On a VPS it works automatically. On a home network, forward port 22 on your router to port 2222 on your machine — hackers will think it's a real SSH server.

**Q: Does it work on Debian/other distros?**
The installer is written for Ubuntu, but it should work on Debian with minor tweaks. Other distros are not supported.

**Q: Where is the database?**
`/opt/honeyblock/honeyblock.db` — it's a SQLite file. You can query it directly with `sqlite3 /opt/honeyblock/honeyblock.db`.
