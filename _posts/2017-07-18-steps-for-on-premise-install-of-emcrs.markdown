---
layout: post
title: Steps for Installing SharePoint Provider Hosted App On Premise
permalink: steps-for-on-premise-install-of-emcrs
date: '2017-07-18 22:37:00'
tags:
- sharepoint
- sharepoint-2013
- sharepoint-app
---

1. Create SharePoint 2013 Farm
2. Create SharePoint site collection with development template.
3. Upload app into “app in testing” library.
4. Create new site using IIS on the vm where the SharePoint is installed.
5. Assign identity for application pool for database connection string to use 
   windows authentication.
6. Install App Management Shared Service Proxy.
7. Miscellaneous Findings
8. Useful Resources

### Create SharePoint 2013 Farm

This step is easy when you use the [new azure portal][azr_p]. Which allows you 
to provision a new farm with a click of a button (and fill in some setup 
configurations).

### Create Certificate

Follow the instruction in the below link. [http://msdn.microsoft.com/en-us/library/office/fp179901.aspx][msdn_c].

### Assign identity for application pool for database connection string to use windows authentication

Assigned identity _sp_setup_ for the application pool and changed _web.config_ 
to use the sql server, and integrated security.

### App Management Shared Service Proxy is not installed.

This error is because you do not have an App Management Service created and or 
the Subscription Settings Service in your Service Applications. To resolve this 
issue go to Central Administration and click the link “Manage service 
applications” under Application Management. Create the App Management Service 
application by clicking New → App Management Service. Type an applicable name 
of the service and application pool ([reference][mavention]).

### Create DNS CNAME entry for the app domain

From cmd.exe, enter these commands:

    dnscmd.exe . /ZoneAdd ContosoApps.com /dsprimary
    dnscmd.exe . /RecordAdd contosoapps.com * CNAME contoso.com

### Miscellaneous Findings

If you get the following error:

> Settings or services required to complete this request are not currently 
available. Try this operation again later. If the problem persists, contact 
your administrator.

Start the Managed Meta data Web Service from the services on server page in 
central admin.

The SharePoint web application needs to support https ssl. If not setup, you 
may get following error messages

> SEC7111: HTTPS security is compromised by [http://sharepoint.contoso.com/sites/dev/\_layouts/15/SP.Runtime.js?=1416849419923][sprt]

### Useful resources

- [http://msdn.microsoft.com/en-us/library/office/fp179901.aspx][msdn_c]
- [http://blogs.technet.com/b/mspfe/archive/2013/01/31/configuring-sharepoint-on-premise-deployments-for-apps.aspx][conf_sp]
- [http://technet.microsoft.com/en-us/library/fp161236%28v=office.15%29.aspx](http://technet.microsoft.com/en-us/library/fp161236%28v=office.15%29.aspx)
- [http://sharepointchick.com/archive/2012/07/29/setting-up-your-app-domain-for-sharepoint-2013.aspx][sp_app]

[azr_p]: <http://portal.azure.com/>
[msdn_c]: <http://msdn.microsoft.com/en-us/library/office/fp179901.aspx>
[mavention]: <http://www.mavention.com/blog/error-occurred-in-deployment-step-install-app-for-sharepoint-app-management-shared-service-proxy-is-not-installed>
[sprt]: <http://sharepoint.contoso.com/sites/dev/_layouts/15/SP.Runtime.js?=1416849419923>
[conf_sp]: <http://blogs.technet.com/b/mspfe/archive/2013/01/31/configuring-sharepoint-on-premise-deployments-for-apps.aspx>
[sp_app]: <http://technet.microsoft.com/en-us/library/fp161236%28v=office.15%29.aspx>