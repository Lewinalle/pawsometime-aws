'use strict';

const AWS = require('aws-sdk');
const uuid = require('uuid');
const axios = require('axios');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const GNEWS_BASE_URL = 'https://gnews.io/api/v3';
const GNEWS_TOKEN = '7a7de48d591d3117d7202e5cc93028cb';

const FETCH_LIMIT = 10;

module.exports.cronNews = async (event) => {
	const scanParams = {
		TableName: process.env.NEWS_TABLE
	};

	try {
		const scanResponse = await dynamoDb.scan(scanParams).promise();

		scanResponse.Items.forEach(async (item, index) => {
			const deleteParams = {
				TableName: process.env.NEWS_TABLE,
				Key: {
					id: item.id
				}
			};

			const deleteResponse = await dynamoDb.delete(deleteParams).promise();
			console.log(`News deleted: ${item.id}`);
		});
	} catch (err) {
		console.error(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	const timestamp = new Date().getTime();

	const API_URL_BASE = `${GNEWS_BASE_URL}/search?token=${GNEWS_TOKEN}&in=title&image=required&limit=${FETCH_LIMIT}`;

	// 'dogs' tag
	const urlPetDog = 'pet,dog';
	const urlPetDogs = 'pet,dogs';
	const urlPuppy = 'puppy';
	const urlPuppies = 'puppies';

	// 'cats' tag
	const urlPetCat = 'pet,cat';
	const urlPetCats = 'pet,cats';
	const urlKitten = 'kitten';
	const urlKittens = 'kittens';

	// 'pets' tag
	const urlPet = 'pet';
	const urlPetPets = 'pet,pets';
	const urlDogCat = 'dog,cat';
	const urlDogsCats = 'dogs,cats';

	const queries = [
		urlPetDog,
		urlPetDogs,
		urlPuppy,
		urlPuppies,
		urlPetCat,
		urlPetCats,
		urlKitten,
		urlKittens,
		urlPet,
		urlPetPets,
		urlDogCat,
		urlDogsCats
	];

	try {
		let duplicateChecker = {};

		for (let i in queries) {
			let URL = `${API_URL_BASE}&q=${queries[i]}`;
			let TAGS;

			if (i < 4) {
				TAGS = 'dogs';
			} else if (i < 8) {
				TAGS = 'cats';
			} else {
				TAGS = 'pets';
			}

			let response = await axios.get(URL);
			console.log(response.data);

			response.data.articles.forEach(async (item, index) => {
				if (!duplicateChecker.hasOwnProperty(item.url)) {
					let params = {
						TableName: process.env.NEWS_TABLE,
						Item: {
							id: uuid.v4(),
							title: item.title,
							description: item.description,
							link: item.url,
							image: item.image,
							publishedAt: item.publishedAt,
							sourceInfo: {
								name: item.source.name,
								link: item.source.url
							},
							tag: TAGS,
							createdAt: timestamp
						}
					};

					let res = await dynamoDb.put(params).promise();
					console.log(`News created: ${params.Item.id}`);

					duplicateChecker[item.url] = true;
				}
			});
		}

		console.log('CRON: News deleted and created successfully!');
		return {
			statusCode: 200,
			body: JSON.stringify('CRON: News deleted and created successfully!')
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
