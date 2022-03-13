---
layout: post
title: dotnet aspnet core https certifcate not found error
date: '2018-10-24 00:00:00'
tags:
- dotnet
- aspnet
- kestrel
- mac
---

I came across this particular issue when my Mac’s account was changed from a domain associated account to a local user account.

Among many other things, my dotnet aspnet core web api was failing to run at the start with the error that said “Unable to configure HTTPS endpoint. No server certificate was specified, and the default developer certificate could not be found.”. The output also has friendly message telling you exactly what to do as well.

> To generate a developer certificate run ‘dotnet dev-certs https’. To trust the certificate (Windows and macOS only) run ‘dotnet dev-certs https —trust’.

Running the command `dotnet dev-certs https` however returned a message that said “A valid HTTPS certificate is already present.”.

You will also get to know that the user profile location is at `~/.aspnet/DataProtection-Keys`. For me, this location already had a few `key-_.xml` files. So, I did made the decision to delete the files. Ran the dev-certs https command again. But again I got the message saying the “A valid HTTPS certificate is already present”. I found there was an option that you could pass to the `dotnet dev-certs https` command, the `--clean` option. When I ran this, I got the message “Cleaning HTTPS development certificates from the machine.”. But, I could find the `key-_.xml` files again in the `~/.aspnet/DataProtection-Keys` directory.

Turns out, that you will need to delete the certificate from the Keychain Access manually as well in order to completely remove the self-signed certificates for localhost.

Running `dotnet dev-certs https` command creates a localhost certificate in your logins section in the Keychain Access app.

<figure class="kg-card kg-image-card kg-card-hascaption"><img src="https://res.cloudinary.com/chekkan/image/upload/v1549403307/Screen_Shot_2018-10-24_at_10.23.08_lf0edr.png" class="kg-image" alt="Screenshot of Keychain Access on Mac - Before" loading="lazy"><figcaption>Screenshot of Keychain Access on Mac - Before</figcaption></figure>

Running `dotnet dev-certs https --trust` command creates a trusted root certificate into your System’s store.

<figure class="kg-card kg-image-card kg-card-hascaption"><img src="https://res.cloudinary.com/chekkan/image/upload/v1549403307/Screen_Shot_2018-10-24_at_10.24.49_g7i9ah.png" class="kg-image" alt="Screenshot of Keychain Access on Mac - After" loading="lazy"><figcaption>Screenshot of Keychain Access on Mac - After</figcaption></figure>

So, if you run into this same issue, make sure to delete the certificate from your **system Certificates** store and also from the **login** keyschain. And run `dotnet dev-certs https` command followed by `dotnet dev-certs https --trust` command.

