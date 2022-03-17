---
layout: post
title: SharePoint 2013 App with Page that gets data from ASP Web Api
date: '2014-06-10 13:35:00'
permalink: sharepoint-2013-app-with-page-that-gets-data-from-asp-web-api
tags:
- sharepoint
- office-365
- webapi
- sharepoint-app
- sharepoint-2013
---

The specific scenario I am trying to address here is when you have a page that 
is deployed into the SharePoint AppWeb and you are trying to access data from 
that AppWeb using a WebApi project for example.

You might be trying to create a SharePoint Hosted App with a separate WebApi 
project that you are planning host on your own. The issue arises when the 
SharePoint Hosted Page tries to access the data from the WebApi site. You will 
get an error that looks something like so.

`XMLHttpRequest cannot load http://localhost:54924/api/actionlogs. No 'Access-Control-Allow-Origin' header is present on the requested resource. Origin 'https://app-0807f4294057b3.sharepoint.com' is therefore not allowed access.`

The issue here relates to Cross-Origins Request, in that the WebApi site gets a 
request from a domain different to that of its own and hence rejects the 
request. To get around this, you could have the server accept requests from any 
domains. This can be achieved by adding `config.EnableCors();` to the 
`WebApiConfig.Register` method. And then adding the attribute 
`[EnableCors(origins: "*", headers: "*", methods: "*")]` to each of the 
ApiControllers. Further information on Cross-Origin Request can be found on 
[this blog][xoreq] by Mike Wasson.

Issue specific to SharePoint apps hosted in Office 365 is that you cannot 
predict the URL of the domain the app will end up in. We cannot add a URL such 
as `"*.sharepoint.com"`. The domain URL has to be either `"*"` or the full 
server address.

One easy fix is to save the name of the server into database when the app is 
installed. This can be achieved by the use of app event receivers. I am sure 
that you can have a SharePoint Hosted App which talks to a remote service for 
event receivers. But, when you add App Installation Handler to a SharePoint 
Hosted App, Visual Studio creates a new project for you and changes the 
appmanifest to say AutoHosted App.

![New web project on handle event Dialog Box][img_newwebprojdlg]

An empty web project is added to the solution. Notice that the Hosting type 
value changed to say `Autohosted`.

![SharePoint Provider Hosted Project in Visual Studio][img_sphpvs]

![Hosted type input box][img_htib]

I believe, if you would like to keep your SharePoint App as SharePoint hosted, 
simply replace the `~remoteAppUrl` part of the value for 
`Properties/InstalledEventEndpoint` in your `appmanifest.xml` to point to your 
actual service project.

To save the app web host URL to the database, open the project property window 
for your SharePoint project and set the values for Handle App Installed and 
Handle App Uninstalled to True.

![SharePoint App Project Properties Window][img_spappw]

Make sure you have a Azure Service Bus namespace created and you copy the 
connection string to SharePoint project Properties Window / SharePoint tab / 
Service Bus Connection String text area. I am not sure why you need this. If 
you don’t, when the installation completes, you get an error which says 
`there is no end point listening at localhost:4563/Services/AppEventReceiver.svc`

Now, in the file `Services/AppEventReceiver.svc` in your remote web project, 
replace the code in the `ProcessEvent` method with the following:


{% highlight csharp %}
public SPRemoteEventResult ProcessEvent(SPRemoteEventProperties properties)
{
    var result = new SPRemoteEventResult();

    switch (properties.EventType)
    {
        case SPRemoteEventType.AppInstalled:
            HandleAppInstalled(properties);
            break;
        case SPRemoteEventType.AppUninstalling:
            HandleAppUninstalling(properties);
            break;
    }

    return result;
}
{% endhighlight %}

The approach above was borowed from the Core.EventReceivers project in the 
[App Model Sample v2][appmsv2] over at CodePlex. Create the following private 
method for handling app install and app uninstall.

{% highlight csharp %}
private void HandleAppInstalled(SPRemoteEventProperties properties)
{
    var appdomainurl = properties.AppEventProperties.AppWebFullUrl.GetComponents(UriComponents.SchemeAndServer,
        UriFormat.SafeUnescaped);
    System.Diagnostics.Trace.WriteLine(string.Format("Adding the app host domain url to db: {0}", appdomainurl));
    // write this value to the database
    var context = new MyContext();
    // only add the domain if it doesnt already exist. because it is the primary key
    // the app uninstall should have remove the domain url
    if (
        context.AppDomains.FirstOrDefault(
            ad => ad.HostUrl.Equals(appdomainurl)) == null)
    {
        context.AppDomains.Add(new Models.AppDomain()
        {
            HostUrl = appdomainurl
        });
        context.SaveChanges();
        System.Diagnostics.Trace.WriteLine(string.Format("Added the app host domain url to db: {0}", appdomainurl));
    }
}

private void HandleAppUninstalling(SPRemoteEventProperties properties)
{
    var appdomainurl = properties.AppEventProperties.AppWebFullUrl.GetComponents(UriComponents.SchemeAndServer,
        UriFormat.SafeUnescaped);
    System.Diagnostics.Trace.WriteLine(string.Format("Removing the app host domain url to db: {0}", appdomainurl));
    // remove this value from the database
    var context = new MyContext();
    context.AppDomains.Remove(
        context.AppDomains.FirstOrDefault(
            ad => ad.HostUrl.Equals(appdomainurl)));
    context.SaveChanges();
    System.Diagnostics.Trace.WriteLine(string.Format("Removed the app host domain url to db: {0}", appdomainurl));
}
{% endhighlight %}

Now, in the `MyCorsPolicyAttribute` file, replace the code with adds two host 
address manually with these code.

{% highlight csharp %}
// Get the domain which had the app installed from the db
var context = new MyContext();
List<string> hosts = context.AppDomains.Select(ad => ad.HostUrl).ToList();

// Add allowed origins.
hosts.ForEach(h => _policy.Origins.Add(h));
{% endhighlight %}

The full code for this sample project can be downloaded from [here][gh_sphpwa]. 
The solution provided is not final and would appreciate your contributions :)

[xoreq]: <http://www.asp.net/web-api/overview/security/enabling-cross-origin-requests-in-web-api>
[img_newwebprojdlg]: <https://res.cloudinary.com/chekkan/image/upload/v1570362485/create-new-project-dialog_dyidb6.png>
[img_sphpvs]: <https://res.cloudinary.com/chekkan/image/upload/v1570362485/new-web-project_awg9br.png>
[img_htib]: <https://res.cloudinary.com/chekkan/image/upload/v1570362485/hosting-type_xer4ai.png>
[img_spappw]: <https://res.cloudinary.com/chekkan/image/upload/v1570362485/spproject-properties_juutfq.png>
[appmsv2]: <https://officeams.codeplex.com/>
[gh_sphpwa]: <https://github.com/chekkan/SPHostedPagesWebApi>