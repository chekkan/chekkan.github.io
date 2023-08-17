---
layout: post
title: Developing for .NET Framework from Mac
date: 2022-11-13 23:53 +0000
tags:
  - dotnet
  - aspnet
  - mac
---

Hopefully not a lot of people are facing the issue of having to work and
maintain an application thats written in .NET Framework. If you are having to,
hopefully you've got plans to get it migrated and running on one of the latest
.NET versions. But, in the mean time, if you are stuck with working on an
application written in .NET Framework but don't want to use Windows for your
development environment, I've got a couple of options for you to consider.

I've only applied these suggestions for a Mac. But, I think they are still valid
options to consider for other Linux operating systems.

## Remotely connecting to a windows machine

If you have a spare Windows laptop, you can set up the Windows laptop to be
RDP'd into from your local network. From your Macbook, install
[Microsoft Remote Desktop][] and connect to the windows laptop.

This approach can be used to remote into any Windows Machines, including virtual
machines provided by your cloud vendor. Obviously, its cheaper if you have a
spare laptop sitting around.

## Dual Boot Windows using Boot Camp Assistant

![boot camp][img_boot_camp]

The trouble I had with this approach was that, there was no point in having the
Macbook. I was always on the Windows OS during work hours. The point of wanting
to use my Macbook was so that I can use Mac OS apps for everything else that is
not coding related.

I also had problems with my Windows partition, such as unexpected shut downs,
blue screen of death etc. Including a wierd one where the computer crashes or
becomes un-responsive when booting up the machine, it fixes automatically after
force restarting the machine couple of times.

If you want to resize your hard drive in the future. I had to re-install the
Windows operating system as clean slate. I've been told afterwards that it is
possible to resize the partition without requiring a clean install. But, I
haven't tried it myself.

At the time I was running Windows 10 and Windows 11 had just released and I
wasn't allowed to upgrade to Windows 11 because of a security related hardware
requirement. I am not sure if this particular issue is sorted or if you still
cannot install Windows 11 with [Boot Camp Assistant][].

## Run Windows as a virtual machine on your Mac

Get hold of a Windows 11 ISO disk image file and use [VirtualBox][] (which is
free) to install and run Windows 11 side by side with your Mac. When I tested
out this particular approach, I found the machine to be very laggy, especially
when trying to build the solution. I also found it difficult to get the virtual
machine screen to go full screen. However, I think if more time was spend at
fixing that particular issue, I would've found a solution.

An alternative to VirtualBox is [Parallels][] which costs £99 per year for the
Professional edition and £89.99 for Home and Student edition at the time of
writing. One of my collegue uses Parallel and get's the company to pay for the
license, and he is happy with his setup. He noted that because its a paid
software, you don't get the lagginess you get with VirtualBox.

## Mono

It seems highly probable to use [Mono][] to compile your .NET Framework application
and run it entirely from your Mac without the need for a Windows installation.
However, I think it depends how much Windows dependent your application is. I
almost got a very Windows dependent classic ASP.NET web application to the point
of running from Mac using Mono, I hit a brick wall when the application failed
at runtime compilation of an ASPX page. I wonder if you can get this entirely
working for a simple enough application, even Classic ASP.NET application.

## Vagrant and Windows 11 in VirtualBox

The solution I've ended up using and have been happy with for atleast a year is
combining Vagrant and VirtualBox together.

You'd use your Mac for editing files and performing GIT operations. File changes
made on Mac is synchronised with Windows machine with the help of sync folders.
You can SSH into my VirtualBox Windows 11 machine using `vagrant ssh` providing
SSH is setup and firewall configured. I have access to PowerShell after SSH'ing
and can invoke any build tasks needed to compile my application and execute the
code.

The problem with this approach is that you only get limited Intellisense or code
completion from your IDE. You don't get compile errors while you are making
changes. You'll have to wait for your build command to finish to get that.

It is also difficult to find a virtual box windows 11 image and also to apply
a valid license to it. What I end up doing is recreate the machine after my
trial runs out (every 60 days). So, keep all instructions written down or better
yet automated so when the machine is recreated, you have minimum work. You will
have to RDP into the machine to do some one off configuration changes
occassionaly. And also say good bye to debugging, or atleast I am not aware of
any options available for this.

## Conclusion

Why bother? Why not give in and use Windows as your development environment?

Carefully considered constraints are good. They open up possibilities or makes
redundant tasks more apparent that were perhaps previously overlooked.
Is intellisense and code completion important to you? Perhaps reading
documentations looking for available methods on a class, or which namespace it
belongs to will make you a better programmer. I find that I can always come up
with an alternative approach to debugging the application. Perhaps its writting
a test, or adding some logs, or something else entirely.

[microsoft remote desktop]: https://apps.apple.com/gb/app/microsoft-remote-desktop/id1295203466?mt=12
[virtualbox]: https://www.virtualbox.org/
[parallels]: https://www.parallels.com/uk/
[vagrant]: https://www.vagrantup.com/
[mono]: https://www.mono-project.com/
[boot camp assistant]: https://support.apple.com/en-gb/guide/bootcamp-assistant/welcome/mac
[img_boot_camp]: https://res.cloudinary.com/chekkan/image/upload/v1669153739/0d7afc467c8c0f4b3ad0d15e9d1ce741_yrmvoa.png
