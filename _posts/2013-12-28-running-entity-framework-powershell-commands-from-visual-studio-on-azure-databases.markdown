---
layout: post
title: Running Entity Framework PowerShell commands from Visual Studio on Azure Databases
date: '2013-12-28 20:56:00'
permalink: running-entity-framework-powershell-commands-from-visual-studio-on-azure-databases
tags:
- azure
- entity-framework
---

One of the cool thing about Entity Framework is that you can use code first to 
build up your database while you are developing your application.

![][img_adhd]
*azure deployment history dashboard*

I have recently started working with Azure Web site and using its Sql Database 
in the cloud. One of the neat thing about this is that, you can use Team 
Foundation Service to check in your code. And have a build to deploy your code 
directly to Azure. This also has the advantage of updating the connection string 
to the Azure Database’s connection string which matches the connection string 
name in your web.config file.

![azure connection string dashboard][img_acsd]
*azure connection string dashboard*

Although, whilst using code-based migration, I haven’t found any straight 
forward way for the Deployment of the code to update my Azure Sql Database.

One work around I found is that you can change the connection string in your 
code to the Azure Sql Database connection string before commiting. And then 
perform the PowerShell commands from your Visual Studio’s Package Manager 
Console. For example, the `Update-Database` command will go to the cloud and 
perform the command on your Azure Sql Database.

![update db package manager console][img_udpm]
*update db package manager console*

Don’t forget to add your current IP address to the Azure Firewall exceptions 
list.

[img_adhd]: <https://res.cloudinary.com/chekkan/image/upload/v1570362053/a3oo_xungsc.png>
[img_acsd]: <https://res.cloudinary.com/chekkan/image/upload/v1570362052/hdmf_tfpcwb.png>
[img_udpm]: <https://res.cloudinary.com/chekkan/image/upload/v1570362052/rzgt_bch5nx.png>