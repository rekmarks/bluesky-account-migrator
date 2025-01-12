#!/bin/bash

# Check if running as root/sudo
if [ "$EUID" -ne 0 ]; then
    echo "Error: This script must be run with sudo privileges"
    echo "Usage: sudo $0 <accountDid>"
    exit 1
fi

# Check if DID parameter is provided
if [ $# -ne 1 ]; then
    echo "Usage: sudo $0 <accountDid>"
    exit 1
fi

ACCOUNT_DID="$1"
# Format timestamp as ISO string with Z suffix
CURRENT_TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")
DB_PATH="/pds/account.sqlite"

# Check if database exists
if [ ! -f "$DB_PATH" ]; then
    echo "Error: Database not found at $DB_PATH"
    exit 1
fi

# Update the emailConfirmedAt field for the specified account
# No need for sudo here since we're already running as root
sqlite3 "$DB_PATH" <<EOF
UPDATE account 
SET emailConfirmedAt = '$CURRENT_TIMESTAMP' 
WHERE did = '$ACCOUNT_DID';

-- Verify if the update affected any rows
SELECT CASE 
    WHEN EXISTS(SELECT 1 FROM account WHERE did = '$ACCOUNT_DID') 
    THEN 'Account updated successfully.'
    ELSE 'Error: Account not found.'
END;
EOF
