# Notion Database to Beautiful Invoice PDF

## Requirements

- Node.js
- Notion Account

## Setup

First, clone the repository and navigate to the project directory.

```sh
  git clone lukasalvarezdev/notion-database-to-invoice-pdf
  cd notion-database-to-invoice-pdf
```

Install the dependencies:

```sh
  npm install
```

Copy the `.env.example` file to `.env` and replace with real values.

```sh
  cp .env.example .env
```

Next, you need to get your Notion API key and database ID.

1. Go to [Notion Integrations](https://www.notion.so/my-integrations).
2. Click on `New Integration`.
3. Name your integration and click `Submit`.
4. Copy the `Internal Integration Secret` and paste it in the `.env` file as `NOTION_API_KEY`.
5. Go to the Notion page you want to use as a database, to get the database ID, check the URL.
   It should look like `https://www.notion.so/{workspace}/{database_id}?v={version}`. Copy the
   `database_id` and paste it in the `.env` file as `NOTION_DATABASE_ID`.

## Usage

Run the development server:

```sh
  npm run dev
```

Open up [http://localhost:3000](http://localhost:3000) in your browser.

## Generate PDF

Just click on the `Generate PDF` button or press `Ctrl + P` to print the page and save it as a
PDF.
