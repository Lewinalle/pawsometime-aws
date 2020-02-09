'use strict';

const AWS = require('aws-sdk');
const s3 = new AWS.S3();

module.exports.getSignedUploadUrl = async (event) => {
	const data = JSON.parse(event.body);
	console.log(data);

	try {
		// get pre-signed url for upload
		const url = await s3.getSignedUrl('putObject', {
			Bucket: 'pawsometime-serverless-s3',
			Key: data.fileName,
			ContentType: data.contentType
		});

		return {
			statusCode: 200,
			body: JSON.stringify(url)
		};
	} catch (err) {
		console.error(err);
		return {
			statusCode: 200,
			body: JSON.stringify(err)
		};
	}
};

// IF YOU WANT TO MAKE S3 BUCKET PRIVATE, THEN YOU HAVE TO USE:
// s3.getSignedUrl('getObject', ...) TO GET PRE_SIGNED URL FOR DOWNLOAD
