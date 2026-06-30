# Mass Email Sender

Send personalised bulk emails from your own Gmail account in seconds.

## Setup

### 1. Create a Google Cloud OAuth Client

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a project (or pick an existing one)
3. Enable the **Gmail API** — *APIs & Services → Library → Gmail API → Enable*
4. Go to *APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID*
5. Application type: **Web application**
6. Authorised JavaScript origins: `http://localhost:5173`
7. Authorised redirect URIs: `http://localhost:5173`
8. Copy the **Client ID**

### 2. Run the app

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, paste your Client ID, and sign in with Google.

---

## How to use

### Step 1 — Recipients

Copy rows from Google Sheets or Excel (including the header row) and paste them in.

- First row **must** be headers
- One header **must** be called `email`
- Any other headers become variables (e.g. `name`, `school`, `company`)

Example spreadsheet:

| email | name | school |
|---|---|---|
| john@example.com | John | MIT |
| jane@example.com | Jane | Oxford |

### Step 2 — Template

Write your subject and email body. Use `<variable>` placeholders:

```
Subject: Hey <name>, quick question about <school>

Hi <name>,

I came across your work from <school> and wanted to reach out...
```

Click a variable badge to insert it at the cursor. Use **Preview** to see how it looks for each recipient.

### Step 3 — Send

Click **Send N emails** — sent from your logged-in Gmail, one by one with a small delay to respect Gmail rate limits. Progress is shown live.

---

## Notes

- Emails are sent as plain text
- Gmail allows ~500 emails/day for regular accounts
- The access token is stored in `localStorage` and expires after 1 hour — click "Re-authorise Google" if needed
- Nothing is stored on any server — everything runs in your browser
