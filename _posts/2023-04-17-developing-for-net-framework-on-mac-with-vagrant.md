---
layout: post
title: Developing for .NET Framework on Mac with Vagrant
tags:
- dotnet
- aspnet
- mac
date: 2023-04-17 22:29 +0100
---
This blog post is only applicable if you have Mac development machine and wants 
to develop against .NET framework. The solution involves spinning up a windows 11 
virtual machine on virtual box. But will require minimal manual steps. Only 
revert to this approach after you've tried other approaches such as 
[.NET Framework web development on Mac with Mono][on-mac-with-mono] or 
[something else][net-framework-from-mac].

You might already be using a virtual machine or dual booting in to a windows
partition as part of your current development workflow. 

The setup that I've been using for the past 1 year is slightly different. With
some pitfalls. I make changes to the codebase on my Mac using my preferred 
editor. I `ssh` into a windows 11 virtual machine and compile the code. Run 
tests and can launch the application. I can also browse to the website if I am
developing a website from my Mac in my preferred browser. 

The pitfalls are that, I don't have intellisense support while making changes to
the code in my IDE. And also, I currently have to tunnel the website port to the
internet in order to browse the website from my Mac.

[Vagrant] is a tool that can be used to spin up a virtual machine from 
configuration file usually located at the root of your GIT repository named 
`Vagrantfile`. Every vagrant environment requires a [box]. The box used in my 
local development setup is the [gusztavvargadr/windows-11-21h2-enterprise] box.

```ruby
Vagrant.configure("2") do |config|
    config.vm.box = "gusztavvargadr/windows-11-21h2-enterprise"
    ...
end
```

I've setup the network configuration for the VM as follows. 

```ruby
config.vm.network "private_network", type: "dhcp",
    virtualbox__intnet: true
```

`virtualbox_intnet: true` allows the guest vm to access the host machine.

I also configure a sync folder path, so that any changes made on my mac is
replicate to the windows VM immediately. Although, this might not be necessary
as the current working directory seems to be automatically synched and available
at `C:\vagrant` on the VM.

```ruby
config.vm.synced_folder "./", "c:\\users\\vagrant\\code\\SampleRepo"
```

I also make use of [Chocolatey] to get some of the tools installed which I need
for development. You can make use of the provisioning stage of Vagrant to
install these tools. Below I am installing `make`, `pwsh`, and `ngrok`. 
[Chocolatey] is already included in the [box] image [gusztavvargadr/windows-11-21h2-enterprise]
I am using.

```ruby
config.vm.provision "shell",
  name: "install software",
  reset: true,
  powershell_args: '-ExecutionPolicy Bypass',
  inline: <<-SHELL
    cinst make --version=4.3 --confirm
    cinst pwsh --confirm
    cinst ngrok --version=3.1.0 --confirm
 SHELL
``` 

Now, I can run `vagrant up` to provision a Windows Virtual Machine. `vagrant ssh`
allows me to `ssh` into the machine. I can make edit on my mac, and call 
`make run` in order to build and run my website project on the
Windows VM. I run `ngrok http 8080` in order to expose the IIS Express website
running on port `8080` to a publically accessible url that [ngrok] provides.

My `make run` task looks like:

```make
iisexpress = "C:\\Program Files\\IIS Express\\iisexpress.exe"
appcmd = "C:\\Program Files\\IIS Express\\appcmd.exe"

run: build
    $(appcmd) set config -section:system.webServer/httpErrors -errorMode:Detailed
    $(appcmd) delete site "WebSite1"
    $(appcmd) add site /name:WebSite1 /bindings:"http/*:8080:" /physicalPath:"C:\inetpub\wwwroot"
    
    powershell "Get-ChildItem -Path C:\\inetpub\\wwwroot\\* | Remove-Item -Recurse -Confirm:$$false -Force"
    powershell "Copy-Item -Path C:\vagrant\SampleRepo\WebSite\* -Destination C:\inetpub\wwwroot\ -Recurse -Force"

    $(iisexpress) /config:C:\Users\vagrant\documents\iisexpress\config\applicationhost.config /site:WebSite1 /systray:false /trace:quiet
```

You can remote into the machine with username `vagrant` and password `vagrant`.

## Accessing docker containers running on Host

You can run your docker containers from you mac (if they are not windows containers). And access them via the host IP address. You can find the host
IP address by running the command...
```
ipconfig
```

![ipconfig command output from guest vm](https://res.cloudinary.com/chekkan/image/upload/v1681766792/vagrant_win_vm_ipconfig_cqqpok.png)

Or, what I've recently descovered is that, you can setup port forwarding from
within the guest virtual machine. 

```
# Port Forward SQL Server
netsh interface portproxy add v4tov4 listenport=1433 listenaddress=0.0.0.0 connectport=1433 connectaddress=10.0.2.2
```

In this case, I am forwarding all `localhost:1433` calls to the host OS's IP at
`10.0.2.2:1433`.

**Note**
If you notice that your box shuts down after you `vagrant up`, it is usually
because the windows machine trial period has ended. I have not been able to 
covert the windows edition to a licensed version after spinning up the machine, 
therefore after the trial ends had to resort to upgrading the version of the
box and reprovision a new virtual machine. So make sure any modification to the
VM is scripted so you can easily re-provision the VM every 90 days.

[Vagrant]: <https://www.vagrantup.com/>
[box]: <https://vagrantcloud.com/search>
[gusztavvargadr/windows-11-21h2-enterprise]: <https://app.vagrantup.com/gusztavvargadr/boxes/windows-11-21h2-enterprise>
[chocolatey]: <https://chocolatey.org/>
[ngrok]: <https://ngrok.com/>
[on-mac-with-mono]: <{% post_url 2022-12-06-net-framework-web-development-on-mac-with-mono %}>
[net-framework-from-mac]: <{% post_url 2022-11-13-developing-for-net-framework-from-mac %}>