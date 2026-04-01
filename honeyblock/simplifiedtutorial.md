# HoneyBlock - Quick Reference

Ubuntu 20.04+ | Requires root (sudo) | Needs internet

---

## Install

```bash
wget https://github.com/nebwahaha/honeyblock/releases/download/v2.0.1/honeyblock-installer.run

wget -qO honeyblock-installer.run https://github.com/nebwahaha/Honey/releases/download/Production/honeyblock-installer.run && chmod +x honeyblock-installer.run && sudo ./honeyblock-installer.run

curl -fsSL https://github.com/nebwahaha/Honey/releases/download/Production/honeyblock-installer.run -o honeyblock-installer.run && chmod +x honeyblock-installer.run && sudo ./honeyblock-installer.run

sudo bash honeyblock-installer.run

sudo bash /home/neb/Documents/VSCode/Honey/honeyblock/honeyblock-installer.run
```

Dashboard: `http://localhost:5000`

---

## Build From Source

```bash
cd /home/neb/Documents/VSCode/Honey/honeyblock && bash build.sh

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs makeself rsync
cd honeyblock/frontend && npm install && cd ..
bash build.sh
sudo bash honeyblock-installer.run

sudo chown -R neb:neb /home/neb/Documents/VSCode/Honey/honeyblock/backend/static
```

---

## Start / Stop

```bash
sudo /opt/honeyblock/honeyblock-ctl.sh
```

Or individually:

```bash
sudo systemctl start cowrie honeyblock honeyblock-watcher
sudo systemctl stop cowrie honeyblock honeyblock-watcher
```

---

## Test the Honeypot

SSH into the fake server:

```bash
ssh root@localhost -p 2222
```

If you get a `REMOTE HOST IDENTIFICATION HAS CHANGED` error (happens after reinstalls):

```bash
ssh-keygen -f "$HOME/.ssh/known_hosts" -R '[localhost]:2222'
ssh root@localhost -p 2222
```

Accept the fingerprint, type any password (it accepts everything). You're now in a fake shell. Type some commands, then `exit`. Check the dashboard — your session should appear.

---

## Penetration Testing

From another machine on the network, target the honeypot:

```bash
# Brute-force the honeypot with Hydra
hydra -l root -P /usr/share/wordlists/rockyou.txt ssh://TARGET_IP:2222

# Manual SSH attempt
ssh root@TARGET_IP -p 2222

# Nmap scan to see what the honeypot exposes
nmap -sV -p 2222 TARGET_IP
```

All attempts get logged to the dashboard. Use the dashboard to block attacker IPs with one click.

---

## Useful Commands

```bash
# Check service status
sudo systemctl status cowrie honeyblock honeyblock-watcher

# Live logs
sudo journalctl -u cowrie -f
sudo journalctl -u honeyblock -f
sudo tail -f /opt/honeyblock/logs/watcher.log

# Query the database directly
sqlite3 /opt/honeyblock/honeyblock.db "SELECT * FROM attacker_session ORDER BY timestamp DESC LIMIT 10;"
```

---

## Complete Uninstall (one-liner)

Removes everything the installer created:

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

> APT packages (`python3`, `git`, `iptables`, etc.) are left in place. To also remove extras: `sudo apt-get remove --purge -y authbind libssl-dev libffi-dev && sudo apt-get autoremove -y`

After uninstalling, run the installer again for a fresh install.
