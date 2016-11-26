# lambdasync-example
Example project for a `Function as a Service` REST API deployed by [Lambdasync](https://github.com/fanderzon/lambdasync).

Follow along the tutorial [Create a REST API on AWS Lambda using Lambdasync](http://fredrik.anderzon.se/2016/11/25/create-a-rest-api-on-aws-lambda-using-lambdasync/) or just deploy the example project and experiment yourself.

## Getting started

You need a MongoDB database setup somewhere, and a `mongodb://` url to that database that the service can connect to. If you don't have a MongoDB database available, don't worry. Follow the steps in the [tutorial](http://fredrik.anderzon.se/2016/11/25/create-a-rest-api-on-aws-lambda-using-lambdasync/) for how to set up a free database at mLab.

You need [Lambdasync](https://github.com/fanderzon/lambdasync), so if you haven't already installed it, do so now:

`npm install -g lambdasync`

Next, clone this repository and inside the project folder run:

`lambdasync`

You will be prompted for [AWS credentials](http://goo.gl/aMbXsg) and then Lambdasync will go off and deploy your endpoint and give you a URL.

Before we can test the API we just need to make the database url available to our service:

`lambdasync secret MONGO_URL=mongodb://xxxxxx:yyyyyy@dszzzzzz.mlab.com:49207/notetaker`

Replace the URL with your own and Lambdasync will add this as a `stageVariable` that the service can access.

## Testing the API

Below are some curl commands you can run in the terminal (make sure to replace the API link with your own)

You can of course test it using anything that sends http requests, like Postman.

```
// POST
curl --request POST \  
  --url https://yourapihere.execute-api.eu-west-1.amazonaws.com/prod/api \
  --header 'cache-control: no-cache' \
  --header 'content-type: application/json' \
  --data '{"title": "Hello Lambda","text": "This text was added by a lambdasync API"}'

// GET
curl --request GET \  
  --url https://yourapihere.execute-api.eu-west-1.amazonaws.com/prod/api \
  --header 'cache-control: no-cache'

// DELETE (replace 9fdcf243-d212-446f-9654-a97e241c66c1 with one of your note ids)
curl --request DELETE \  
  --url https://yourapihere.execute-api.eu-west-1.amazonaws.com/prod/api/9fdcf243-d212-446f-9654-a97e241c66c1 \
  --header 'cache-control: no-cache'

// UPDATE (replace 9fdcf243-d212-446f-9654-a97e241c66c1 with one of your note ids)
curl --request PUT \  
  --url https://yourapihere.execute-api.eu-west-1.amazonaws.com/prod/api/9fdcf243-d212-446f-9654-a97e241c66c1 \
  --header 'cache-control: no-cache' \
  --header 'content-type: application/json' \
  --data '{"id":"9fdcf243-d212-446f-9654-a97e241c66c1","title":"New title","text":"New text too","pinned": true}'
```
