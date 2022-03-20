---
layout: post
title: Packaging SharePoint 2013 App With TFS 2013 build
date: '2014-12-09 19:13:00'
permalink: packaging-sharepoint-2013-app-with-tfs-2013-build
tags:
- continuous-integration
- sharepoint-2013
- sharepoint-app
- tfs
- tfs-2013
- msbuild
---

If you have wondered why the tfs drop folder doesn’t contain the app.publish 
folder like it does when you run the command 
`msbuild.exe /p:IsPackaging=true /p:OutputPath="D:\dev\"` in your local 
machine, it’s because the property `/p:PublishDir` also needs to be set in 
addition to `/p:IsPackaging=true`.

So, your continuous integration build definition should have the following msbuild arguments

    /p:IsPackaging=true /p:PublishDir="$(TF_BUILD_BINARIESDIRECTORY)"\app.publish\`

Notice that I am using one of the [TFS Build Environment variables][tfs] to set 
the value of `/p:PublishDir` property. So that the tfs build will package the 
web site and SharePoint app to the binaries directory. The contents of the 
`TF_BUILD_BINARIESDIRECTORY` is then copied to your drop folder.

Hope this has been helpful as it has caused me a lot of headache to find out.

[tfs]: <http://msdn.microsoft.com/en-gb/library/hh850448.aspx>
