---
layout: post
title: Deploying SharePoint Provider Hosted App as part of the TFS 2013 Build Process
permalink: deploying-sharepoint-provider-hosted-app-as-part-of-the-tfs-2013-build-process
date: '2017-07-12 22:28:00'
tags:
- azure
- continuous-integration
- sharepoint
- sharepoint-2013
- sharepoint-app
---

I have been working on a SharePoint provider hosted app. In this project, we 
have an azure website, a database per installation of the app, and couple of 
web jobs. This blog is about my attempt at creating a build system which for 
now will run every night if there was any check ins since the last run of the 
build. I want the build to do a number of things.

1. Build the solution
2. Run some unit tests
3. Install the SharePoint Provider Hosted App on to an office 365 dev site 
   collection
4. Upload the azure website
5. Upload the web jobs
6. Update the backing code first entity framework databases.

A lot of requirements I know. Hopefully you might have a similar requirement. 
I am not going to try and explain all the little details because so many people 
have already blogged about this. These blogs helped me to come up with a build 
process which helped me to meet my requirement. I will be referencing these 
blog post here. But, I had to make my own tweaks to meet my need which I will 
mention in this blog.

I thought I will list the prerequisites at the top so that i can put links and 
it will be easy for you to find it in one place.

**Prerequisites:** Build server needs to have 
[SharePoint Online Manafement Shell][mcr_spoms]. Make sure you are installing 
to a site with the developer template. Otherwise, trying to upload the app via 
powershell script will throw Sideloading of apps is not enabled on Sequence 
this site error. Update your web jobs nuget package. At the time of this post, 
the latest update was … And you need it.

Go to [http://officesharepointci.codeplex.com][ospci] and download the latest 
source code. Follow the instructions at the documentation section to figure out 
where to place the source codes. The version I had downloaded was 1.1.0.1.

I had an issue with the downloaded version of officesharepointci build 
template. The name of my build definition had spaces, and the msbuild.exe is 
not too fond of spaces in the arguments. So, I was getting errors from my build 
process that “Only one project can be specified in the msbuild arguments Switch 
…“. The issue was that the template I downloaded was passing along an argument 
called “PublishDir” to the msbuild.exe and they did not have the value for the 
argument in quotes. I had to edit the template to add the quotes to the line.

    [String.Format("{0} /p:PublishDir=""{1}\app.publish\""", MSBuildArguments, BinariesDirectory)]

I have uploaded this change as a patch to the officesharepointci project so 
that hopefully you wouldn’t run into the same issue. Another note of caution, 
if you are deploying to an office 365 site collection, make sure to leave out 
the `$SpDeployUserDomain` variable in the `parameters.ps1` file and the 
`$SpDeployUsername` needs to be in the format 
`{username}@{tenant}.onmicrosoft.com`. The documentation in the 
officesharepointci project does not provide you with this detail. If you are 
publishing the remote app to azure, in my experience, it is better to use the 
msbuild to do this.

[mcr_spoms]: <http://www.microsoft.com/en-gb/download/details.aspx?id=35588>
[ospci]: <http://officesharepointci.codeplex.com/>
