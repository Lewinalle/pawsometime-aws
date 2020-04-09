'use strict';

const AWS = require('aws-sdk');
const TimSort = require('timsort');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const fetchFriendsActivity = require('./fetchFriendsActivity');
const fetchGallery = require('./fetchGallery');
const fetchMeetups = require('./fetchMeetups');
const fetchNews = require('./fetchNews');
const fetchPosts = require('./fetchPosts');
const fetchUserInfo = require('./fetchUserInfo');

module.exports.fetchData = async (event) => {
	console.log(event.queryStringParameters);

	const userId = event.queryStringParameters.userId;
	const lat = event.queryStringParameters.lat;
	const lon = event.queryStringParameters.lon;

	const user = await fetchUserInfo.fetchUserInfo(userId);
	const gallery = await fetchGallery.fetchGallery(userId);
	const meetups = await fetchMeetups.fetchMeetups(null, lat, lon);
	const userMeetups = await fetchMeetups.fetchMeetups(userId);
	const news = await fetchNews.fetchNews();
	const posts = await fetchPosts.fetchPosts();
	const userPosts = await fetchPosts.fetchPosts(userId);
	const friendsActivity = await fetchFriendsActivity.fetchFriendsActivity(user);

	const res = {
		DBUser: user,
		userGallery: gallery,
		meetups,
		userMeetups,
		news,
		posts,
		userPosts,
		friendsActivity
	};

	console.log(res);

	return {
		statusCode: 200,
		body: JSON.stringify(res)
	};
};
