# Port Forwarding Guide (PLDT)

## 1. Get your Ubuntu PC's local IP

```bash
hostname -I
```

Note the IP (e.g. `192.168.1.5`)

## 2. Open PLDT router admin

Go to `http://192.168.1.1` in your browser

- Username: `admin`
- Password: check the sticker on your router (usually `admin` or the Wi-Fi password)

## 3. Port forward

Go to **Advanced** > **NAT** > **Port Forwarding** (or Virtual Server)

Add this entry:

| Field         | Value           |
|---------------|-----------------|
| Service Name  | Honeypot        |
| External Port | 22              |
| Internal IP   | 192.168.1.5     |
| Internal Port | 2222            |
| Protocol      | TCP             |

Replace `192.168.1.5` with your actual IP from step 1.

Save and apply.

## 4. Test it

From your phone (use mobile data, NOT Wi-Fi) or any device outside your network:

```bash
ssh root@YOUR_PUBLIC_IP
```

To find your public IP, run this on the Ubuntu PC:

```bash
curl ifconfig.me
```

## DO NOT port forward port 5000 — that's your dashboard. Only access it from your local network.
