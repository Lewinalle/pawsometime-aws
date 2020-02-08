'use strict';

const AWS = require('aws-sdk');

const dynamoDb = new AWS.DynamoDB.DocumentClient();

module.exports.request = async (event) => {
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (userFriendsObj.sent.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request already sent',
				userMessage: 'There is an existing friend request.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	if (userFriendsObj.pending.includes(data.friendId)) {
		// remove userId from friendId's sent
		newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

		// remove friendId from userId's pending
		newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

		// add each other's id to both userId's friends and friendId's friends
		newFriendFriendsObj.friends.push(data.userId);
		newUserFriendsObj.friends.push(data.friendId);
	} else {
		// add userId to friendId's pending
		newFriendFriendsObj.pending.push(data.userId);

		// add friendId to userId's sent
		newUserFriendsObj.sent.push(data.friendId);
	}

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};

module.exports.accept = async (event) => {
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.pending.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request not found',
				userMessage: 'The friend request is not found.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	// add each other's id
	newFriendFriendsObj.friends.push(data.userId);
	newUserFriendsObj.friends.push(data.friendId);

	// remove userId from friendId's sent
	newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

	// remove friendId from userId's pending
	newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

	// remove from sent if any
	if (userFriendsObj.sent.includes(data.friendId)) {
		newUserFriendsObj.sent = userFriendsObj.sent.filter((item) => item !== data.friendId);
	}

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};

module.exports.reject = async (event) => {
	const data = JSON.parse(event.body);
	let userFriendsObj;
	let friendFriendsObj;

	let newUserFriendsObj;
	let newFriendFriendsObj;

	// validation
	if (typeof data.userId !== 'string' || typeof data.friendId !== 'string') {
		console.error('Validation Failed!');
		return {
			statusCode: 400,
			body: JSON.stringify({
				developerMessage: 'Validation Failed!',
				userMessage: 'One of the fields is not valid.'
			})
		};
	}

	const searchParams = {
		TableName: process.env.USERS_TABLE,
		ExpressionAttributeValues: {
			':userId': data.userId,
			':friendId': data.friendId
		},
		FilterExpression: 'id = :userId OR id = :friendId'
	};

	try {
		const res = await dynamoDb.scan(searchParams).promise();
		console.log(res);

		if (res.Count < 2 || res.Items.length < 2) {
			return {
				statusCode: 422,
				body: JSON.stringify({
					developerMessage: 'Users not found.',
					userMessage: 'Users not found.'
				})
			};
		}

		for (let item of res.Items) {
			if (item.id === data.userId) {
				userFriendsObj = item.friends;
				newUserFriendsObj = item.friends;
			}
			if (item.id === data.friendId) {
				friendFriendsObj = item.friends;
				newFriendFriendsObj = item.friends;
			}
		}
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}

	if (!userFriendsObj.pending.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'Friend request not found',
				userMessage: 'The friend request is not found.'
			})
		};
	}

	if (userFriendsObj.friends.includes(data.friendId)) {
		return {
			statusCode: 422,
			body: JSON.stringify({
				developerMessage: 'User is already in the friend list',
				userMessage: 'The user is already in the friend list.'
			})
		};
	}

	// remove userId from friendId's sent
	newFriendFriendsObj.sent = friendFriendsObj.sent.filter((item) => item !== data.userId);

	// remove friendId from userId's pending
	newUserFriendsObj.pending = userFriendsObj.pending.filter((item) => item !== data.friendId);

	try {
		let userUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.userId
			},
			ExpressionAttributeValues: {
				':friends': newUserFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let userUpdateRes = await dynamoDb.update(userUpdateParams).promise();
		console.log(userUpdateRes);

		let friendUpdateParams = {
			TableName: process.env.USERS_TABLE,
			Key: {
				id: data.friendId
			},
			ExpressionAttributeValues: {
				':friends': newFriendFriendsObj
			},
			UpdateExpression: 'SET friends = :friends',
			ReturnValues: 'ALL_NEW'
		};

		let friendUpdateRes = await dynamoDb.update(friendUpdateParams).promise();
		console.log(friendUpdateRes);

		return {
			statusCode: 200,
			body: JSON.stringify({
				user: userUpdateRes.Attributes,
				friend: friendUpdateRes.Attributes
			})
		};
	} catch (err) {
		console.log(err);

		return {
			statusCode: 422,
			body: JSON.stringify(err)
		};
	}
};
