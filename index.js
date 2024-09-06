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
};

async function getRedditPost() {
	try {
		const response = await axios.get('https://www.reddit.com/r/terraria/top.json?t=hour', {
			headers: {
				accept:
					'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
				'accept-language': 'en-US,en;q=0.9',
				'cache-control': 'max-age=0',
				cookie:
					'rdt=a04368304640a02e3c0e90230478cd96; edgebucket=JrOoNuKXY6o0Ak9ocx; csv=2; loid=000000000y60orvups.2.1712942269145.Z0FBQUFBQm0xakdhbDNXQXhackxibU9NLXBZdC15cVo4UUxwbC1SY3hyaVNrSnlldTZuZHJPWTJzN1FiOWhrMUl1a1FXbC15MWhDbldnc2VOdVpSVDVEbjlGSkx4VE9YUHlWLVFLbktjNjJaeUszWFV0MjdVMXVHTC1qUFd6WkkxMUFFbTNabEVDVnU; theme=2; pc=ih; t2_y60orvups_recentclicks3=t3_iahnrs%2Ct3_ijmzh7%2Ct3_15hvam4%2Ct3_dx0hbo%2Ct3_z6i3es%2Ct3_1359p7m%2Ct3_hk1kpx%2Ct3_o90dke%2Ct3_1dzsg82%2Ct3_1e0rt0e; __stripe_mid=6616f5e7-0bf6-4444-8dcd-c1f033a1e506c2c6b0; __stripe_sid=76e724f2-5448-4c5c-9c5a-e84982ac78f4a6ad3a; g_state={"i_p":1725457392721,"i_l":2,"i_t":1725457390218}; reddit_session=96389419862080%2C2024-09-03T13%3A44%3A17%2Ce0f4d9b5ccfab2d94e5676a06c70a11413b06e76; token_v2=eyJhbGciOiJSUzI1NiIsImtpZCI6IlNIQTI1NjpzS3dsMnlsV0VtMjVmcXhwTU40cWY4MXE2OWFFdWFyMnpLMUdhVGxjdWNZIiwidHlwIjoiSldUIn0.eyJzdWIiOiJ1c2VyIiwiZXhwIjoxNzI1NDU3NDYxLjU1Mzg5OCwiaWF0IjoxNzI1MzcxMDYxLjU1Mzg5OCwianRpIjoib2FxcGY1X1YxcnhCWF9NX29vUExPZHJGMkZXZEJ3IiwiY2lkIjoiMFItV0FNaHVvby1NeVEiLCJsaWQiOiJ0Ml95NjBvcnZ1cHMiLCJhaWQiOiJ0Ml95NjBvcnZ1cHMiLCJsY2EiOjE3MTI5NDIyNjkxNDUsInNjcCI6ImVKeGtrZEdPdERBSWhkLWwxejdCX3lwX05odHNjWWFzTFFhb2szbjdEVm9jazcwN2NMNGlIUDhuS0lxRkxFMnVCS0drS1dFRld0T1VOaUx2NTh5OU9aRUZTeUZUUjg0M3l3b2thVXBQVW1ONXB5bFJ3V1prTGxmYXNVS0RCNllwVlM2WjIwS1BTNXZRM0kxRnowNk1xbHhXSHRUWW8zSnBiR01LMnhQanpjWnFReXF1eTZsTVlGa29uOFdMZnZ5Ry10WS1mN2JmaEhZd3JLZ0tEX1RPdUZ4d1lfSERGSGJfbnByMGJGMndxTDNYZzlRLTEtTjI3Yk5tb2RtNV9WelB2emFTY1RtRzVpZll2N3QtQ1IxNDVIbVpVUWN3WWcwX3lyQWo2X0N2T29ES0JRV01KWWhQSTVBcmwyX19KZGl1VGY4YXR5ZC0tR2JFVFdfNHJSbW81eExFb1VfajZ6Y0FBUF9fWERfZTR3IiwicmNpZCI6IjM0Q0U2OFlkQTdROTc4dzNmQ1VDaUtsdGJJUVRMX05xdHdJSVhzdG9mdGsiLCJmbG8iOjJ9.JFD5IQvqRsBSOkhQcNolZuvXEpQpiOW4OoNsOWjLbHZ5dU3sHRoupDeZF8A-VmliwXZwgXu-4DKi3PL5AbWfUAJG5WmRyahXpKJtz_1EfbS_dIBDYF-PQ88XrALDVw088y5jz2DyZ9WGd6JE0aFKAMhLP9_KkhBw7dsLY9TIad7wEyUsdGwOZMWNJAudCjINb07tS-J51Z_IWcU-TljBOQTc88E1xRCIQKRTbe3lbcLNGAXQQKtP4z4Jxzf7jzpXce7NM4d35m9AGHi_WDIY-oNHfJ9aHSvq8eGxO7d-BOoregGQYHhRkw12ThS3W4mZsgSFOsMxBwQzXQdXZXNuEQ; csrf_token=93108a3deab0f0d03a708b7bab90a0df; session_tracker=rfhjnqphgqpnpglmck.0.1725372589197.Z0FBQUFBQm0xeGl0TDRlcVZtOGlEbkhuZmlGN2o2U05HV29qbjM3ZkVIc0I4S1Z2NldLcFBHMFc1Y3NxUXVidVNQRXRkWUlGcWRJMHJyWDZDbkp4UTRrTjFsczZvRnNLV3NVbTl2UVlyM1pIMThVOTRJWnBpREpxZzZNelM0b0JzLWtaNlVKZlQ5OFc',
				dnt: '1',
				priority: 'u=0, i',
				'sec-ch-ua': '"Not;A=Brand";v="24", "Chromium";v="128"',
				'sec-ch-ua-mobile': '?0',
				'sec-ch-ua-platform': '"macOS"',
				'sec-fetch-dest': 'document',
				'sec-fetch-mode': 'navigate',
				'sec-fetch-site': 'none',
				'sec-fetch-user': '?1',
				'upgrade-insecure-requests': '1',
				'user-agent':
					'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36'
			},
		});

		const posts = response.data.data.children
			.map((post) => ({
				title: post.data?.title,
				link: `redd.it/${post.data?.id}`,
				id: post.data?.id,
				preview: post.data?.url,
			}))
			.filter((post) => !post.preview.includes('gallery'))
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
			responseType: 'arraybuffer',
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
			password: process.env.PASSWORD,
		});

		const post = getRandomPost();
		const imagePath = await downloadImage(post.preview);
		const compressedImagePath = await compressImage(imagePath);

		console.log('Post:', post);

		await bot.post({
			text: `${post.title} ${post.link}`,
			images: [{ data: getBlob(compressedImagePath) }],
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

initializeDatabase(); // Iniciar a instância do banco de dados

const job = new CronJob('0 * * * *', async () => {
	try {
		await populateDb();
		await postOnBluesky();
	} catch (error) {
		console.error('Error during cron job execution', error);
	}
}, null, true, 'America/Sao_Paulo');

job.start();
