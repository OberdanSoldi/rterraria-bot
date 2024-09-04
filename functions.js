import {Database} from "bun:sqlite";

export function getRandomPost() {
    using db = new Database("db.sqlite");
    using query = db.query("SELECT * FROM posts WHERE posted = 0 ORDER BY RANDOM() LIMIT 1");
    return query.get();
}

export function getPosts() {
    using db = new Database("db.sqlite");
    using query = db.query("SELECT * FROM posts");
    return query.all();
}

export function markPostAsPosted(postId) {
    using db = new Database("db.sqlite");
    using query = db.query(`
        UPDATE posts
        SET posted = 1
        WHERE id = ?
    `);
    query.run(postId);
}

export function insertPost(post) {
    using db = new Database("db.sqlite");
    using query = db.query(`
        INSERT OR IGNORE INTO posts (id, posted, link, preview, title)
        VALUES (?, ?, ?, ?, ?)
    `);

    query.run(post.id, false, post.link, post.preview, post.title);
}