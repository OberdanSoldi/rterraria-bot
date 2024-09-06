import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from "sharp";
import { Bot } from '@skyware/bot';
import { v4 as uuidv4 } from 'uuid';
import { getRandomPost, insertPost, markPostAsPosted, initializeDatabase } from "./functions.js";
import { CronJob } from "cron";

const config = {
	jpeg: { quality: 60 },
	webp: { quality: 60 },
	png: { compressionLevel: 2 },
	jpg: { quality: 60 },
}

async function getRedditPost() {
	try {
		const response = await axios.get('https://www.reddit.com/r/terraria/top.json?t=hour', {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
			}
		});

		const posts = response.data.data.children
			.map((post) => ({
				title: post.data?.title,
				link: `redd.it/${post.data?.id}`,
				id: post.data?.id,
				preview: post.data?.url
			}))
			.filter((post) => !post.preview.includes("gallery"))
			.filter((post) => Object.keys(config).includes(post.preview.split('.').pop()));

		return posts.length ? posts : null;
	} catch (error) {
		console.error('Error fetching reddit posts', error);
		throw error;
	}
}

async function downloadImage(imageUrl) {
	try {
		const response = await axios.get(imageUrl, {
			responseType: 'arraybuffer'
		});

		const imageName = uuidv4();
		const imageExtension = imageUrl.split('.').pop();
		const buffer = Buffer.from(response.data);

		const imgPath = path.join(__dirname, 'img', `${imageName}.${imageExtension}`);
		fs.writeFileSync(imgPath, buffer);

		return imgPath;
	} catch (error) {
		console.error('Error downloading image', error);
		throw error;
	}
}

function removeImages(imagePaths) {
	try {
		imagePaths.forEach((image) => {
			fs.unlinkSync(image);
		});
		console.log('Removed images', imagePaths);
	} catch (error) {
		console.error('Error removing images', error);
		throw error;
	}
}

async function compressImage(imagePath) {
	try {
		const image = sharp(imagePath);
		const { format, width, height } = await image.metadata();

		const compressedImageName = uuidv4();
		const compressedImagePath = path.join(__dirname, 'img', `${compressedImageName}.${format}`);

		if (width > height) {
			await image[format](config[format]).resize({ width: 600 }).toFile(compressedImagePath);
		} else {
			await image[format](config[format]).resize({ height: 600 }).toFile(compressedImagePath);
		}

		// Destruir imagem original para liberar memória
		image.destroy();

		return compressedImagePath;
	} catch (error) {
		console.error('Error compressing image', error);
		throw error;
	}
}

function getBlob(imagePath) {
	try {
		const imageBuffer = fs.readFileSync(imagePath);
		const imageFormat = imagePath.split('.').pop();
		return new Blob([imageBuffer], { type: `image/${imageFormat}` });
	} catch (error) {
		console.error('Error reading image file:', error);
		throw error;
	}
}

async function postOnBluesky() {
	try {
		const bot = new Bot();
		await bot.login({
			identifier: process.env.IDENTIFIER,
			password: process.env.PASSWORD
		});

		const post = getRandomPost();
		const imagePath = await downloadImage(post.preview);
		const compressedImagePath = await compressImage(imagePath);

		console.log('Post:', post);

		await bot.post({
			text: `${post.title} ${post.link}`,
			images: [{ data: getBlob(compressedImagePath) }]
		});

		removeImages([imagePath, compressedImagePath]);
		markPostAsPosted(post.id);
	} catch (error) {
		console.error('Error posting on Bluesky', error);
		throw error;
	}
}

async function populateDb() {
	try {
		const posts = await getRedditPost();

		if (!posts) {
			console.log('No posts to insert');
			return;
		}

		posts.forEach((post) => {
			insertPost(post);
		});
	} catch (error) {
		console.error('Error populating database', error);
	}
}

initializeDatabase();  // Iniciar a instância do banco de dados

const job = new CronJob('0 * * * *', async () => {
	try {
		await populateDb();
		await postOnBluesky();
	} catch (error) {
		console.error('Error during cron job execution', error);
	}
}, null, true, 'America/Sao_Paulo');

job.start();
