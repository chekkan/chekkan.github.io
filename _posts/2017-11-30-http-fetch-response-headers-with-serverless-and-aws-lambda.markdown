---
layout: post
title: Access response headers in HTTP Fetch API with Serverless Framework and 
  AWS Lambda
permalink: http-fetch-response-headers-with-serverless-and-aws-lambda
date: '2017-11-30 00:23:00'
cover: https://images.unsplash.com/photo-1508802153073-e549b30d1ac0?ixlib=rb-1.2.1&q=80&fm=jpg&crop=entropy&cs=tinysrgb&w=2000&fit=max&ixid=eyJhcHBfaWQiOjExNzczfQ
tags:
- aws
- serverless-framework
- lambda
- http
- node-js
---

In order to access response headers such as `Location` in HTTP Fetch api whilst 
using Serverless Framework and AWS Lambda Functions with CORS enabled, you need 
to do the following.

Make sure `cors` is set to `true` on `serverless.yml`

{% highlight yaml %}

postUsers:
  handler: handler.postUsers
  events:
    - http:
      path: users
      method: post
      cors: true

{% endhighlight %}

Make sure in the response header, you are returning the following:

{% highlight javascript %}

callback(null, {
  statusCode: 201,
  headers: {
    "Access-Control-Allow-Origin": "*",
    // Required for cookies, authorization headers with HTTPS
    "access-control-allow-credentials": true,
    "access-control-allow-headers": "Location",
    "access-control-expose-headers": "Location",
    Location: id
  }
});

{% endhighlight %}

Now, you can access the header `location` from `fetch`.

{% highlight javascript %}

this.httpClient
  .fetch("/users", {
    method: "post",
    body: json({ username: "chekkan" })
  })
  .then(res => {
    return res.headers.get("location");
  });

{% endhighlight %}

**References:**

- [Serverless.yml CORS](https://serverless.com/framework/docs/providers/aws/events/apigateway#enabling-cors)
- [Access-Control-Allow-Headers - Mozilla Developer](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Allow-Headers)

_Photo by [Paul Buffington](https://unsplash.com/photos/Lwe2hbm5XKk?utmsource=unsplash&utmmedium=referral&utmcontent=creditCopyText) 
on [Unsplash](https://unsplash.com/?utmsource=unsplash&utmmedium=referral&utmcontent=creditCopyText)_

