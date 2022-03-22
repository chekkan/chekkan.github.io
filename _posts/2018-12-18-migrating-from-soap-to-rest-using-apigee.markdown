---
layout: post
title: Migrating from SOAP to REST using Apigee
date: '2018-12-18 11:57:00'
permalink: migrating-from-soap-to-rest-using-apigee
tags:
- wcf
- soap
- rest
- apigee
- api
- dotnet
- swagger
---

Apigee is another option for converting your SOAP services to a RESTful API. I 
covered Azure API management in [another blog post][apim_soap_blog]. I will use 
the same [**calculator SOAP service**][wcf_calc] to create a SOAP to REST API 
proxy in Apigee.

From the Apigee edge homepage, select the API Proxies tile.

![API Proxies tile][img_api_prox_tile]
*API Proxies tile*

Click the create “Proxy” button in the right hand corner to start the API Proxy 
creation wizard.

![Create Proxy wizard - Options][img_create_proxy_wzd]
*Create Proxy wizard - Options*

I have chosen the **“SOAP service”** option and selected continue.

In the next screen, fill out the form as below.

![Create proxy wizard - SOAP service][img_create_proxy_wzd_ss]
*Create proxy wizard - SOAP service*

Enter the WSDL URL is the public calculator url and select **“Validate”**. 
There is no option to version the API at the point. That means no support for 
API versioning through header or query string; which are popular options in 
REST. So, I have included the `/v1/` in the base path and selected **Next**.

In the following screen, specify which WSDL operations to expose in your proxy. 
Similar to the Azure API Management - SOAP to REST option, there is a 
_Pass-Through SOAP_ option as well. But, I will choose the _REST to SOAP to 
REST_ option. Also, notice that I have only selected the first _Port Type_.

![Create proxy wizard - WSDL operations][img_cpw_wsdl_op]
*Create proxy wizard - WSDL operations*

The mapping has for some reason thinks that the operations other than _Add_ 
should be an `HTTP GET` method. I will change these to `POST` and move to the 
next screen.

The next step is to secure access for users and clients.

![Create proxy wizard - secure proxy][img_cpw_sec_p]
*Create proxy wizard - secure proxy*

I will select the API key option and also select to publish the product. I am 
assuming that the product concept is similar to the Azure API Management.

Next section allows you to select the desired virtual hosts.

![Create proxy wizard - virtual hosts][img_cpwvh]
*Create proxy wizard - virtual hosts*

> **Note:** If you plan to use the developer portal, make sure to select the 
default option (http). Otherwise, the developer portal Try functionality won’t 
work as it only works for (http).

The trial account that I am using provides you with two environments. Higher 
tier gives you 3 environments for the proxy.

In the build section of the wizard, I am only going to deploy to the test 
environment. So, will select **“Build and Deploy”** button.

![Create proxy wizard - build and deploy][img_cpwbd]
*Create proxy wizard - build and deploy*

Once the proxy is build and deployed, navigate to the API proxy overview page 
by selecting the “View in editor” link. Take some time to familiarize yourself 
with the different options available to you. Especially the “Develop” tab on 
the top right hand corner and the policies within there.

Because we selected the option to require API key when making calls to the API 
proxy, in order to try out the endpoints created you will need to create a new 
App and assign one of the developer to the App. I created an App called 
Calculator App and assigned it to the developer came with my trial account.

![Apigee - Create a new app][img_apicna]
*Apigee - Create a new app*

![Apigee - App Details credentials][img_api_adc]
*Apigee - App Details credentials*

Once the App is created, you can get the API Key from the App Details page, 
Under credentials -\> consumer key (click the “Show” button).

And finally, to try out the API Add operation, use postman or curl to perform 
the POST `/add` operation. Note, that the url is case sensitive and api key is 
expected to be in the query string `?apikey= ********* `.

![Postman POST add operation][img_pmpao]
*Postman POST add operation*

## Tracing

A cool feature available in the Apigee Edge web app is Tracing. Access it by 
going to the API details page and then select “Trace” tab. Tracing allows you 
to listen to API proxy calls and drill down into the request process pipeline 
and visualize the each step of the policy really well. One limitation I found 
was that the web app only allows you to send GET request. However, you can send 
the requests using postman or other tools and still capture it and visualize on 
the website.

![Apigee Edge - Tracing visualization][img_apietv]
*Apigee Edge - Tracing visualization*

## Developer portal

In order to add the API Proxy into the Developer Portal, you need to setup the 
API Specs manually. As part of the creation of the SOAP to REST api, an 
endpoint called the `/openapi.json` was also setup. Use this endpoint together 
with the `?apikey= ****** ` to create a new Api Spec from URL.

![Apigee - Import API Spec from URL][img_aiasfu]
*Apigee - Import API Spec from URL*

Now, that you have a successfully created the API Spec for Calculator, you will 
see a UI similar to the Swagger UI.

![Apigee API Spec][img_apias]
*Apigee API Spec*

Even though, you have functionality to try out, it wont work as we said that we 
require an api key to make the calls. And there is no option available to pass 
in that parameter in the UI.

Now, that we have the spec, we can go ahead and create a portal **Publish** 
navigation section. I will give the portal some name. Afterwards, go ahead and 
add the Calculator API product from the Portal details screen. Note that I 
selected the API Spec we created above.

![Apigee - Add API to portal][img_apiaatp]
*Apigee - Add API to portal*

Navigate to the Developer portal by clicking on the **“live dashboard”** link 
at the top right hand corner. You can browse the site as an unauthorised user. 
However, you still won’t be able to try out the APIs if your api required a 
token. I tried registering a new user, logged in and even creating a new App to 
see if the API key will be picked up. But, no luck! You will have to modify the 
spec to incude a query string param `apikey`.

Even though I updated the spec file to include the `apikey` parameter in the 
query string, the developer portal wasn’t working.

![Apigee - developer portal try it with api key][img_dptiwak]
*Apigee - developer portal try it with api key*

## Analytics

There is a navigation section entirely dedicated to Analyze the API proxy 
performance. With in the section, there are multiple categories such as API 
Proxy Performance, Cache Performance, Developer Engagement, Devices, Error Code 
Analysis, Geomap, Reports, Target Performance, Traffic and Composition. If 
there were multiple proxies, those are denoted as demensions in the various 
categories. You also have a drop down to select the environment.

![Apigee - analytics][img_analytics]
*Apigee - analytics*

Even though there is a category called “Error Code Analysis”, there was no 
means of drilling down in to the errors themselves.

## Additional Resources

- 🎥 [An Introduction to Apigee Edge](https://youtu.be/jWwmWvhI40Q)
- 🔗 [Exposing a SOAP service as an API proxy](https://docs.apigee.com/api-platform/develop/exposing-soap-service-api-proxy)

[apim_soap_blog]: <{% post_url 2018-12-14-migrating-from-soap-to-rest-using-azure-api-management %}>
[post_part_2]: <{% post_url 2018-02-13-setting-up-elasticsearch-cluster-on-kubernetes-part-2-kibana %}>
[wcf_calc]: <http://www.dneonline.com/calculator.asmx?wsdl>
[img_api_prox_tile]: <https://res.cloudinary.com/chekkan/image/upload/v1549403307/Screen_Shot_2018-12-17_at_15.44.53_vcloub.png>
[img_create_proxy_wzd]: <https://res.cloudinary.com/chekkan/image/upload/v1549403307/Screen_Shot_2018-12-17_at_15.47.47_uavpsy.png>
[img_create_proxy_wzd_ss]: <https://res.cloudinary.com/chekkan/image/upload/v1549403307/Screen_Shot_2018-12-17_at_15.49.39_yrw484.png>
[img_cpw_wsdl_op]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_15.53.42_yuhrtw.png>
[img_cpw_sec_p]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_16.21.24_xe8rxr.png>
[img_cpwvh]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_16.29.07_drlwyp.png>
[img_cpwbd]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_16.34.35_xhxdck.png>
[img_apicna]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_17.04.42-1_tfdggr.png>
[img_api_adc]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_17.06.10_c66uix.png>
[img_pmpao]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_17.13.57_xqlrug.png>
[img_apietv]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_17.25.37_z49o3j.png>
[img_aiasfu]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-17_at_18.01.19_qmyutp.png>
[img_apias]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-18_at_09.38.40_tumzwd.png>
[img_apiaatp]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-18_at_10.05.25_vzf8rp.png>
[img_dptiwak]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-18_at_11.22.30_wezxri.png>
[img_analytics]: <https://res.cloudinary.com/chekkan/image/upload/v1549403308/Screen_Shot_2018-12-18_at_11.42.23_zjwvui.png>
