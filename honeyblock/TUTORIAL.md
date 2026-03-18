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
wget https://github.com/nebwahaha/honeyblock/releases/download/v2.0.1/honeyblock-installer.run
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

## Starting and Stopping HoneyBlock

HoneyBlock does **not** auto-start on boot. You control when it runs.

### Option 1: Desktop shortcut (easiest)

After installing, you'll find a **HoneyBlock** icon on your desktop. Double-click it:
- If HoneyBlock is stopped → it starts all services (you'll be asked for your password)
- If HoneyBlock is running → it stops all services

> On Ubuntu, you may need to right-click the icon and select "Allow Launching" the first time.

### Option 2: Terminal command

```bash
sudo /opt/honeyblock/honeyblock-ctl.sh
```

This toggles all services on or off.

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

---

## Complete Uninstall

If you want to completely remove HoneyBlock and start fresh, follow these steps. This removes **everything** the installer and the running application created on your system.

### What gets installed (full list)

For reference, here is every file, directory, and artifact that the installer and the running application place on your system:

| Category | Location |
|----------|----------|
| HoneyBlock app | `/opt/honeyblock/backend/`, `/opt/honeyblock/frontend/` |
| Python virtual env | `/opt/honeyblock/venv/` |
| SQLite database | `/opt/honeyblock/honeyblock.db` (+ `-wal` and `-shm` files) |
| Watcher state file | `/opt/honeyblock/watcher.pos` |
| Watcher log | `/opt/honeyblock/logs/watcher.log` |
| Control script | `/opt/honeyblock/honeyblock-ctl.sh` |
| Cowrie honeypot | `/home/cowrie/cowrie/` (source, venv, config) |
| Cowrie runtime data | `/home/cowrie/cowrie/var/log/cowrie/` (logs), `/home/cowrie/cowrie/var/lib/cowrie/` (TTY logs, downloads), `/home/cowrie/cowrie/var/run/cowrie/` (PID files) |
| Cowrie system user | `cowrie` user and group |
| Systemd services | `/etc/systemd/system/cowrie.service`, `honeyblock.service`, `honeyblock-watcher.service` |
| Systemd enable symlinks | `/etc/systemd/system/multi-user.target.wants/cowrie.service`, `honeyblock.service`, `honeyblock-watcher.service` (only if auto-start was toggled on) |
| Polkit policy | `/usr/share/polkit-1/actions/com.honeyblock.ctl.policy` |
| Desktop shortcut | `~/Desktop/HoneyBlock.desktop` |
| iptables rules | DROP rules in the INPUT chain (added when you block IPs via the dashboard) |
| Temp extraction | `/tmp/honeyblock-dist` (normally auto-cleaned, but may remain if installer was interrupted) |
| APT packages | `python3`, `python3-pip`, `python3-venv`, `git`, `iptables`, `authbind`, `libssl-dev`, `libffi-dev` |

### Step 1: Stop and disable all services

```bash
sudo systemctl stop honeyblock-watcher honeyblock cowrie
sudo systemctl disable honeyblock-watcher honeyblock cowrie 2>/dev/null
```

### Step 2: Remove the systemd service files and enable symlinks

```bash
sudo rm -f /etc/systemd/system/cowrie.service \
           /etc/systemd/system/honeyblock.service \
           /etc/systemd/system/honeyblock-watcher.service \
           /etc/systemd/system/multi-user.target.wants/cowrie.service \
           /etc/systemd/system/multi-user.target.wants/honeyblock.service \
           /etc/systemd/system/multi-user.target.wants/honeyblock-watcher.service
sudo systemctl daemon-reload
```

### Step 3: Remove HoneyBlock files

This deletes the backend, frontend, database (+ WAL/SHM files), logs, state file, venv, and control script.

```bash
sudo rm -rf /opt/honeyblock
```

### Step 4: Remove Cowrie and its user

This deletes the Cowrie honeypot (source code, virtual environment, runtime logs, captured TTY sessions, downloaded files, keys) and the `cowrie` system user.

```bash
sudo rm -rf /home/cowrie
sudo deluser --remove-home cowrie 2>/dev/null; sudo groupdel cowrie 2>/dev/null
```

### Step 5: Remove the desktop shortcut

```bash
rm -f ~/Desktop/HoneyBlock.desktop
```

### Step 6: Remove the polkit policy

```bash
sudo rm -f /usr/share/polkit-1/actions/com.honeyblock.ctl.policy
```

### Step 7: Flush iptables rules added by HoneyBlock

If you blocked any IPs through the dashboard, those DROP rules are still in your firewall. This removes them:

```bash
sudo iptables -S INPUT 2>/dev/null | grep -- '-j DROP' | while read -r rule; do
  sudo iptables $(echo "$rule" | sed 's/^-A/-D/')
done
```

### Step 8: Clean up temp extraction leftovers

```bash
sudo rm -rf /tmp/honeyblock-dist
```

### Step 9: Clear the SSH known host (optional)

If you connected to Cowrie via SSH during testing, remove the saved host key so you don't get a warning on the next install.

```bash
ssh-keygen -f "$HOME/.ssh/known_hosts" -R '[localhost]:2222'
```

### Quick one-liner

If you want to do it all in one shot, copy and paste this:

```bash
sudo systemctl stop honeyblock-watcher honeyblock cowrie 2>/dev/null; \
sudo systemctl disable honeyblock-watcher honeyblock cowrie 2>/dev/null; \
sudo rm -f /etc/systemd/system/cowrie.service \
           /etc/systemd/system/honeyblock.service \
           /etc/systemd/system/honeyblock-watcher.service \
           /etc/systemd/system/multi-user.target.wants/cowrie.service \
           /etc/systemd/system/multi-user.target.wants/honeyblock.service \
           /etc/systemd/system/multi-user.target.wants/honeyblock-watcher.service; \
sudo systemctl daemon-reload; \
sudo rm -rf /opt/honeyblock; \
sudo rm -rf /home/cowrie; \
sudo deluser --remove-home cowrie 2>/dev/null; sudo groupdel cowrie 2>/dev/null; \
sudo rm -f /usr/share/polkit-1/actions/com.honeyblock.ctl.policy; \
rm -f ~/Desktop/HoneyBlock.desktop; \
sudo iptables -S INPUT 2>/dev/null | grep -- '-j DROP' | while read -r rule; do
  sudo iptables $(echo "$rule" | sed 's/^-A/-D/')
done; \
sudo rm -rf /tmp/honeyblock-dist; \
ssh-keygen -f "$HOME/.ssh/known_hosts" -R '[localhost]:2222' 2>/dev/null
```

### What this does NOT remove

The installer also installs some system packages (`python3`, `python3-pip`, `python3-venv`, `git`, `iptables`, `authbind`, `libssl-dev`, `libffi-dev`) via `apt`. These are left in place because other programs on your system might depend on them. If you want to remove them too:

```bash
sudo apt-get remove --purge -y authbind libssl-dev libffi-dev
sudo apt-get autoremove -y
```

> **Note:** Do NOT remove `python3`, `git`, or `iptables` — your system likely depends on them.

After uninstalling, you can do a fresh install by simply running `sudo bash honeyblock-installer.run` again.
