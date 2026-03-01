import ipaddress
import os
import re
import subprocess


def _validate_ipv4(ip: str) -> str | None:
    """Return the normalised IP string, or None if invalid."""
    try:
        addr = ipaddress.IPv4Address(ip)
        if addr.is_loopback or addr.is_unspecified:
            return None
        return str(addr)
    except (ipaddress.AddressValueError, ValueError):
        return None


def _has_privileges() -> bool:
    return os.geteuid() == 0


def _run(args: list[str]) -> dict:
    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=10,
        )
        if result.returncode != 0:
            return {"success": False, "message": result.stderr.strip() or f"Command exited with code {result.returncode}"}
        return {"success": True, "message": result.stdout.strip()}
    except subprocess.TimeoutExpired:
        return {"success": False, "message": "Command timed out"}
    except OSError as exc:
        return {"success": False, "message": str(exc)}


def block_ip(ip: str) -> dict:
    clean_ip = _validate_ipv4(ip)
    if clean_ip is None:
        return {"success": False, "message": f"Invalid IPv4 address: {ip}"}

    if not _has_privileges():
        return {"success": False, "message": "Insufficient privileges — run as root or with sudo"}

    result = _run(["sudo", "iptables", "-I", "INPUT", "-s", clean_ip, "-j", "DROP"])
    if result["success"]:
        result["message"] = f"Blocked {clean_ip}"
    return result


def unblock_ip(ip: str) -> dict:
    clean_ip = _validate_ipv4(ip)
    if clean_ip is None:
        return {"success": False, "message": f"Invalid IPv4 address: {ip}"}

    if not _has_privileges():
        return {"success": False, "message": "Insufficient privileges — run as root or with sudo"}

    result = _run(["sudo", "iptables", "-D", "INPUT", "-s", clean_ip, "-j", "DROP"])
    if result["success"]:
        result["message"] = f"Unblocked {clean_ip}"
    return result


def get_blocked_ips_from_iptables() -> dict:
    if not _has_privileges():
        return {"success": False, "message": "Insufficient privileges — run as root or with sudo", "ips": []}

    result = _run(["sudo", "iptables", "-L", "INPUT", "-n"])
    if not result["success"]:
        result["ips"] = []
        return result

    ips = []
    for line in result["message"].splitlines():
        match = re.match(r"^DROP\s+all\s+--\s+(\d+\.\d+\.\d+\.\d+)\s+0\.0\.0\.0/0\s*$", line)
        if match:
            ips.append(match.group(1))

    return {"success": True, "message": f"Found {len(ips)} blocked IP(s)", "ips": ips}


if __name__ == "__main__":
    import sys

    if not _has_privileges():
        print("Error: run this script as root or with sudo")
        sys.exit(1)

    info = get_blocked_ips_from_iptables()
    print(f"Currently blocked IPs: {info['ips']}")
