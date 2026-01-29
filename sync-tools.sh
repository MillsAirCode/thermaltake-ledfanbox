#!/bin/bash
# Bidirectional TOOLS.md.gpg sync with Natalie (10.0.0.119)

LOCAL=~/clawd/TOOLS.md.gpg
REMOTE=remote@10.0.0.119:/home/remote/clawd/TOOLS.md.gpg

# Get timestamps
LOCAL_TIME=$(stat -c %Y "$LOCAL" 2>/dev/null || echo 0)
REMOTE_TIME=$(ssh -o BatchMode=yes remote@10.0.0.119 "stat -c %Y /home/remote/clawd/TOOLS.md.gpg 2>/dev/null || echo 0")

if [ "$REMOTE_TIME" -gt "$LOCAL_TIME" ]; then
    echo "[$(date)] Remote newer, pulling from Natalie"
    scp -o BatchMode=yes "$REMOTE" "$LOCAL"
elif [ "$LOCAL_TIME" -gt "$REMOTE_TIME" ]; then
    echo "[$(date)] Local newer, pushing to Natalie"
    scp -o BatchMode=yes "$LOCAL" "$REMOTE"
else
    echo "[$(date)] Files in sync"
fi
