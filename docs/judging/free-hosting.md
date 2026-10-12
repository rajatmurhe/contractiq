# Free-host release operation

The public deployment stays on Render's current free service. No new service, paid disk or paid database is provisioned. Existing model usage still consumes the configured provider's quota/credits.

The server stores SQLite in `/data/reviews.sqlite3`. On free ephemeral hosting, restart/redeploy can discard this file. Google identity does not make that disk persistent. Keep exported JSON/HTML copies of needed reviews. User deletion removes an active review, its saved chat and audit entries; linked revisions must be deleted first. Guest access expiry does not delete data automatically.

For local hosting or a host that provides filesystem access:

```sh
python scripts/review_backup.py backup data/reviews.sqlite3 /PRIVATE-BACKUP-DIRECTORY/reviews-YYYYMMDD.sqlite3
python scripts/review_backup.py restore /PRIVATE-BACKUP-DIRECTORY/reviews-YYYYMMDD.sqlite3 data/restored.sqlite3
```

Commands create a new destination only, set private file permissions and run SQLite integrity checking. Restore into a new path, stop the service, and point `REVIEW_DB` at the verified restored file before restarting. Backup files contain contract text and conversations: restrict access and delete according to the owner's retention policy. This tool is not a scheduled cloud backup and cannot retrieve data already lost from a free Render instance.
