'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetchNews = async () => {
	const params = {
		TableName: process.env.NEWS_TABLE
	};

	try {
		const res = await dynamoDb.scan(params).promise();

		if (res.Items.length > 0) {
			TimSort.sort(res.Items, (a, b) => {
				if (a.publishedAt === b.publishedAt) return 0;
				else if (a.publishedAt > b.publishedAt) return -1;
				else return 1;
			});
		}

		return res.Items;
	} catch (err) {
		console.log(err);

		return err;
	}
};

exports.fetchNews = fetchNews;
