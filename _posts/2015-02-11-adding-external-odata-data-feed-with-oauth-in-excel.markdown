---
layout: post
title: Adding External OData Feed with OAuth in Excel
permalink: adding-external-odata-data-feed-with-oauth-in-excel
date: '2015-02-11 17:43:00'
tags:
- webapi
- oauth
- odata
- excel
- power-query
- power-pivot
- basic-authentication
---

I have a web api which surfaces some odata collections using the asp.net web 
api v2 together with OData v3. I tried to use OData v4, but Excel 
‘Add data feed’ wasn’t liking that at all. But, I wanted to have some way for 
the user to authenticate themselves before using service. I preferred to use 
OAuth in order to achieve this as it met all my other requirements.

I am using Excel 2013 and has got PowerPivot add on. Adding an OData feed which 
doesn’t require any authentication is easy in excel. You can use ‘Power Query’, 
‘Power Pivot’, or the ‘Data tab -\> Add External Data -\> Add OData Data Feed 
option’. However, adding an OData feed which has OAuth as its authentication is 
difficult or damn near impossible.

After searching for hours and doing some hacking (decompiling 
Microsoft.Data.DataFeedClient.dll), I came up with a connection string that did 
the trick.

`Data Provider=Microsoft.Data.DataFeedClient;Data Source=http://localhost:51584/api/;Include Atom Elements=Auto;Include Expanded Entities=False;Integrated Security=OAuth;User ID=asdsadsa;Password=asdadsad;Persist Security Info=False;Time Out=600;Schema Sample Size=25;Retry Count=5;Retry Sleep=100;Keep Alive=False;Scope=List.Read;Refresh Token={refresh_token};Client ID={client_id};Refresh URL=http://localhost:51584/api/oauth;Client Secret={client_secret};Max Received Message Size=4398046511104;Service Document Url=http://localhost:51584/api/3/; Authentication Token=Basic 2323jkj`

`Refresh Token`, `User ID`, `Password`, `Refresh URL`, `Scope`, `Client ID`, 
and `Client Secret` are required. Because `Integrated Security` is not `SSIS`, 
excel complains and asks for these parameters to be provided.

You can see in the connection string that I am setting the 
`Integrated Security=OAuth`. This, allows excel to retry the OData feed URL 
when the first try returns a `401` Status Code.

    Request
    --------
    GET api HTTP/1.1
    User-Agent: PowerPivotExcel15
    
    Response
    ---------
    HTTP/1.1 401 Unauthorized
    Content-Type: application/json; charset=utf-8
    WWW-Authenticate: Bearer
    Date: Wed, 11 Feb 2015 16:50:19 GMT
    
    {"Message":"Authorization has been denied for this request."}

I did not get further by using the Power Pivot -\> Add Data Feed option. 
However, by adding an existing connection using the ‘Data Tab’, I was able to 
use the connection string above to retrieve the data back.

![Add existing connection data tab in excel][img_excel]

*Add existing connection data tab in excel*

If an `Authentication Token` value is provided, excel retries the data source 
with `Authentication Token` added into the HTTP Header `WWW-Authenticate`. If 
the `Authentication Token` is null or empty, `DataFeedClient` tries to retrieve 
an access token by posting a request to `Refresh URL` together with the 
`Refresh Token`.

    POST /api/oauth HTTP/1.1
    User-Agent: PowerPivot
    Content-Type: application/x-www-form-urlencoded
    Host: localhost
    Content-Length: 545
    Expect: 100-continue
    grant_type=refresh_token&refresh_token={refresh_token}&scope={scope}&client_id={client_id}&client_secret={client_secret}

The response to this request for refresh token should return back an 
`access_token`. Which is then used by excel to make a successful connection to 
the OData feed.

    GET /api HTTP/1.1
    User-Agent: PowerPivot
    WWW-Authenticate: Bearer asdasdasda:

All this is great, but it comes with huge security implications. First is that 
the `Client ID` and `Client Secret` needs to be shared with the user. Maybe, we 
can store and issue separate `Client ID` and `Client Secret` from that of the 
ones provided by the `Identity Provider`. And each user who needs to access the 
data has to ask for a new client id and secret from a user interface. But, what 
about the `refresh token`? We defenetly cannot give that out to each users. If 
we issue our own refresh tokens, then we will have manage it’s scope, and the 
expiration policies. I certainly didn’t want to implement that.

Another issue with this approach is that the data added to excel from OData 
feed cannot be refreshed. This is caused by not being able to save a password 
in the connection string. When we try to refresh, excel prompts us to enter 
username and password. Adding some dummy value and clicking Ok doesn’t trigger 
the OAuth workflow for some reason.

I ended up supporting ‘Basic Authentication’ for my Web Api but, I hope this 
post has informed or inspired someone and hope to hear any feedback or a 
different approach.

You might want to visit these links.

- [Power BI Blog](http://blogs.msdn.com/b/powerbi/)

[img_excel]: <https://res.cloudinary.com/chekkan/image/upload/v1570362834/excel_data_add_existing_connections_xxviaj.png>