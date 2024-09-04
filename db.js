import {Database} from "bun:sqlite";

const db = new Database("db.sqlite");

db.exec(`
    DROP TABLE IF EXISTS posts;
`)

db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        posted BOOLEAN,
        link TEXT,
        preview TEXT,
        title TEXT
    );
`);

db.close();