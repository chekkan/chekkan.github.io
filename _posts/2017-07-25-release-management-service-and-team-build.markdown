---
layout: post
title: Release Management Service and VSTS Team Build
date: '2017-07-25 22:38:00'
tags:
- vsts
- powershell
- powershell-dsc
- azure-devops
---

I’ve started working on a new project at my company and it is a massive project compared to anything I have done previously. We are not short on technologies in this project starting with an angular web site all the way to using elastic search. One of the challenges we faced daily was releasing all the different systems that is part of project into dev, test, staging and production.

This is a blog post explaining the different challenges I faced and going through step by step each challenges.

Let me be clear about the different technologies and environments used in this walk through so that it is clear for you.

1. Visual Studio Team Services - At the time of this writing the latest release for visual studio [13th April 2016](https://www.visualstudio.com/en-us/news/2016-apr-13-vso) had came out.
2. GIT - for the source control
3. Angular with Typescript on the front end.
4. ASP.NET WebAPI 2 on the server
5. NServiceBus with Azure Service Bus
6. MongoDB
7. Elastic Search
8. SQL Server

The challenge was how to automate the full deployment of all these various technologies into deferent environment that was repeatable and to deliver our code that was predictable.

My experience before starting this with regards to continuos delivery and operations were zero to none.

At first, I had spend some time looking into PowerShell DSC. It seems promising as VSTS at the time had Release Management Application which only supported PowerShell DSC. It wasn’t too long into PowerShell DSC that I ran into some difficulties with PowerShell DSC. To name a few, when I first started, there weren’t a lot of built in Resources that I could use. There were a few which I could get from the inter webs, but it was difficult to get it downloaded into the machine itself. Such as the IIS Site resources, xWebSite resource, xWebAdministrator resource, etc.

The error messages provided by PowerShell DSC were really difficult to diagnose. Finding the answers on google searches were not straight forward etc. I finally decided that PowerShell wasn’t the way forward and that we needed to rely on something else to get the job done.

I had a few weeks to go down this route before I knew Microsoft was bringing release management into their cloud web portal.

