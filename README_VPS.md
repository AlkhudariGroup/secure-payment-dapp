# Deploying to a VPS (Private Server)

This guide explains how to deploy this Next.js application to your own VPS (Virtual Private Server) using Docker. This gives you full control and privacy compared to Vercel.

## Prerequisites

1.  **A VPS Server:** You can get one from providers like DigitalOcean, Linode, AWS, Hetzner, etc. (Ubuntu 20.04/22.04 recommended).
2.  **Domain Name (Optional):** If you want to access your site via `example.com` instead of an IP address.
3.  **SSH Access:** You must be able to connect to your server via terminal.

## Step 1: Prepare the Server

Connect to your VPS:
```bash
ssh root@your-server-ip
```

Install Docker and Docker Compose:
```bash
# Update system
apt update && apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

## Step 2: Upload Code

You can use `git` to pull your code if it's in a private repository, or upload files directly.

**Option A: Using Git (Recommended)**
1.  Generate an SSH key on your server: `ssh-keygen -t ed25519`
2.  Add the key (`cat ~/.ssh/id_ed25519.pub`) to your GitHub Deploy Keys.
3.  Clone the repo:
    ```bash
    git clone git@github.com:your-username/your-repo.git /var/www/ahmad-app
    cd /var/www/ahmad-app
    ```

**Option B: Upload Files Manually**
Use SFTP or `scp` to upload the project folder to `/var/www/ahmad-app`.

## Step 3: Run the Application

Navigate to the project directory and run:

```bash
docker compose up -d --build
```

- `-d`: Runs in detached mode (background).
- `--build`: Forces a rebuild of the Docker image.

Your app should now be running on `http://your-server-ip:3000`.

## Step 4: Setup Nginx & SSL (HTTPS) - Recommended

To serve your site securely on port 80/443 with a domain name:

1.  **Install Nginx:**
    ```bash
    apt install nginx -y
    ```

2.  **Configure Nginx:**
    Create a config file: `nano /etc/nginx/sites-available/ahmad-app`
    ```nginx
    server {
        listen 80;
        server_name your-domain.com; # Replace with your domain or IP

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
    ```

3.  **Enable Site:**
    ```bash
    ln -s /etc/nginx/sites-available/ahmad-app /etc/nginx/sites-enabled/
    rm /etc/nginx/sites-enabled/default
    nginx -t
    systemctl restart nginx
    ```

4.  **Add SSL (HTTPS) with Certbot:**
    ```bash
    apt install certbot python3-certbot-nginx -y
    certbot --nginx -d your-domain.com
    ```

## Updating the App

When you have changes, just pull the latest code and restart:

```bash
cd /var/www/ahmad-app
git pull origin main
docker compose up -d --build
```
