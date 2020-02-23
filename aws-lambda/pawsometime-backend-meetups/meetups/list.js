'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const MAX_OFFSET = 0.1;
const DEFAULT_NUM_ITEMS = 200;

module.exports.list = async (event) => {
	let title = '';
	let description = '';
	let userName = '';
	let userId = '';

	let lat;
	let lon;
	let offset;

	let attrValues = {};
	let filterExp = '';

	// check latlon and offset
	if (!event.queryStringParameters || !event.queryStringParameters.lat || !event.queryStringParameters.lon) {
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed! lat and lon param missing.',
				userMessage: 'lat and lon param must be provided.'
			})
		};
	}

	// set lat & lon
	lat = Number(event.queryStringParameters.lat);
	lon = Number(event.queryStringParameters.lon);
	console.log(lat, lon, offset);

	// set offset
	if (!event.queryStringParameters.offset || Number(event.queryStringParameters.offset) > MAX_OFFSET) {
		offset = Number(MAX_OFFSET);
	} else {
		offset = Number(event.queryStringParameters.offset);
	}

	// set filterValues and filterExpression
	attrValues[':minLat'] = lat - offset;
	attrValues[':maxLat'] = lat + offset;
	attrValues[':minLon'] = lon - offset;
	attrValues[':maxLon'] = lon + offset;

	filterExp += '(latlon.lat between :minLat and :maxLat) AND (latlon.lon between :minLon and :maxLon)';

	// search title
	if (event.queryStringParameters && event.queryStringParameters.title) {
		title = event.queryStringParameters.title;

		attrValues[':title'] = title;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (title, :title)';
	}

	// search description
	if (event.queryStringParameters && event.queryStringParameters.description) {
		description = event.queryStringParameters.description;

		attrValues[':description'] = description;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (description, :description)';
	}

	// search userName
	if (event.queryStringParameters && event.queryStringParameters.userName) {
		userName = event.queryStringParameters.userName;

		attrValues[':userName'] = userName;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'contains (userName, :userName)';
	}

	// search userId
	if (event.queryStringParameters && event.queryStringParameters.userId) {
		userId = event.queryStringParameters.userId;

		attrValues[':userId'] = userId;
		if (filterExp !== '') {
			filterExp += ' AND ';
		}
		filterExp += 'userId = :userId';
	}

	let params = {
		TableName: process.env.MEETUPS_TABLE
	};

	if (filterExp !== '') {
		params.ExpressionAttributeValues = attrValues;
		params.FilterExpression = filterExp;
	}

	try {
		let page =
			event.queryStringParameters &&
			event.queryStringParameters.page &&
			!isNaN(Number(event.queryStringParameters.page)) &&
			Number(event.queryStringParameters.page) > 1
				? ~~Number(event.queryStringParameters.page)
				: 1;

		console.log('params: ' + JSON.stringify(params));
		let res = await getAllData(params, page);
		console.log('res: ' + JSON.stringify(res));

		TimSort.sort(res, (a, b) => {
			if (a.updatedAt === b.updatedAt) return 0;
			else if (a.updatedAt > b.updatedAt) return -1;
			else return 1;
		});

		return {
			statusCode: 200,
			body: JSON.stringify(res.slice(0, page * DEFAULT_NUM_ITEMS - 1))
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
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
