#!/bin/bash
# Keep Render instance awake by pinging every 10 minutes
# Usage: crontab -e  ->  */10 * * * * /path/to/keep-alive.sh
# Or use cron-job.org with URL: https://techvault-store.onrender.com/

curl -s -o /dev/null -w "Ping em %{time_total}s - HTTP %{http_code}\n" \
  https://techvault-store.onrender.com/api/products/featured
