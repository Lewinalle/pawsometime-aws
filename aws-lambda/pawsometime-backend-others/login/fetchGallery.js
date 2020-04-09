'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const DEFAULT_NUM_ITEMS = 200;

const fetchGallery = async (userId) => {
	let attrValues = {};
	let filterExp = '';

	attrValues[':userId'] = userId;
	if (filterExp !== '') {
		filterExp += ' AND ';
	}
	filterExp += 'userId = :userId';

	let params = {
		TableName: process.env.GALLERY_TABLE
	};

	if (filterExp !== '') {
		params.ExpressionAttributeValues = attrValues;
		params.FilterExpression = filterExp;
	}

	try {
		let page = 1;

		console.log('params: ' + JSON.stringify(params));
		let res = await getAllData(params, page);
		console.log('res: ' + JSON.stringify(res));

		TimSort.sort(res, (a, b) => {
			if (a.updatedAt === b.updatedAt) return 0;
			else if (a.updatedAt > b.updatedAt) return -1;
			else return 1;
		});

		return res.slice(0, page * DEFAULT_NUM_ITEMS - 1);
	} catch (err) {
		console.log(err);

		return err;
	}
};

const getAllData = async (params, page) => {
	let allData = [];

	let data = await dynamoDb.scan(params).promise();

	if (data['Items'].length > 0) {
		allData = [ ...allData, ...data['Items'] ];
	}

	while (data.LastEvaluatedKey && allData.length < page * DEFAULT_NUM_ITEMS) {
		console.log('There are more items to search (over 1MB). Fetching More!');
		params.ExclusiveStartKey = data.LastEvaluatedKey;

		let data = await dynamoDb.scan(params).promise();

		if (data['Items'].length > 0) {
			allData = [ ...allData, ...data['Items'] ];
		}
	}

	console.log('Fetching Done!');
	return allData;
};

exports.fetchGallery = fetchGallery;
