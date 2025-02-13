# Installation
## install docker and docker compose

### On Windows
* Install Windows Subsystem for Linux (WSL) from Company portal, or you can download from Microsoft store, search Ubuntu
* Select version to install, recommend LTS versions
* Install docker on WSL refer to https://dev.to/0xkoji/install-docker-on-wsl2-2ma5
* Connect VSCode to WSL
* Docker relies on iptables to configure networking, and it appears that the iptables version installed is using nf_tables (nftables backend), which might not be compatible with Docker on WSL. Then we need to switch `iptables` to legacy mode by command:
```bash
sudo update-alternatives --set iptables /usr/sbin/iptables-legacy
sudo update-alternatives --set ip6tables /usr/sbin/ip6tables-legacy
```
* Restart Docker Service
```bash
service docker restart
```
*Note: Maybe each time starting WSL, we need to start dockerd manually by command `dockerd`


# Build
docker compose build 

# Run
docker compose up -d

# Access to API docs
https://127.0.0.1/api/v1/chat/docs