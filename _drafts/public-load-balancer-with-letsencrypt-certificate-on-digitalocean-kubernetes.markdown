---
layout: post
title: Public load balancer with LetsEncrypt certificate on DigitalOcean Kubernetes
tags:
- kubernetes
- docker
- container
---

DigitalOcean Kubernetes service

### DigitalOcean load balancer pricing

DigitalOcean charges $0.015 per hour which comes to around $10 per month at the time of writing this post. Which is a bit expensive compared to other cloud platforms. However, there are no additional charges. Please read [their documentation](https://www.digitalocean.com/products/load-balancer/) to get more up to date information.

Sample container

kubectl

<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="https://www.digitalocean.com/docs/apis-clis/doctl/reference/compute/certificate/create/"><div class="kg-bookmark-content">
<div class="kg-bookmark-title">doctl compute certificate create | DigitalOcean Product Documentation</div>
<div class="kg-bookmark-description">This command allows you to create a certificate. There are two supported certificate types: Let’s Encrypt certificates, and custom certificates. Let’s Encrypt certificates are free and will be auto-renewed and managed for you by DigitalOcean. To create a Let’s Encrypt certificate, you’ll need to a…</div>
<div class="kg-bookmark-metadata"><img class="kg-bookmark-icon" src="https://www.digitalocean.com/apple-touch-icon.png"></div>
</div>
<div class="kg-bookmark-thumbnail"><img src="https://assets.digitalocean.com/articles/pdocs/docs-banner.png"></div></a></figure>

in order to create a lets encrypt certificate, your will need to have domain created in Digital Oceans. Once you have domain created, execute the following command to create the certificate and get the id.

    doctl compute certificate create --type lets_encrypt --name example-org-lets-encrypt --dns-names example.org

### deployment.yaml file

    ---
    kind: Service
    apiVersion: v1
    metadata:
      name: example-org
      annotations:
        service.beta.kubernetes.io/do-loadbalancer-protocol: "http"
        service.beta.kubernetes.io/do-loadbalancer-algorithm: "round_robin"
        service.beta.kubernetes.io/do-loadbalancer-tls-ports: "443"
        service.beta.kubernetes.io/do-loadbalancer-certificate-id: "<certificate-id>"
        service.beta.kubernetes.io/do-loadbalancer-redirect-http-to-https: "true"
    spec:
      type: LoadBalancer
      selector:
        app: example-web
      ports:
        - name: http
          protocol: TCP
          port: 80
          targetPort: <port>
        - name: https
          protocol: TCP
          port: 443
          targetPort: <port>
    ---
    apiVersion: apps/v1
    kind: Deployment
    metadata:
      name: example-deployment
    spec:
      selector:
        matchLabels:
          app: example-web
      replicas: 1 # tells deployment to run 1 pod matching the template
      template:
        metadata:
          labels:
            app: example-web
        spec:
          containers:
            - name: <container-name>
              image: ghcr.io/<owner>/example:latest
              ports:
                - containerPort: 3000

References:

<figure class="kg-card kg-bookmark-card"><a class="kg-bookmark-container" href="https://www.digitalocean.com/docs/kubernetes/how-to/add-load-balancers/"><div class="kg-bookmark-content">
<div class="kg-bookmark-title">How to Add Load Balancers to Kubernetes Clusters | DigitalOcean Product Documentation</div>
<div class="kg-bookmark-description">Declare a DigitalOcean Load Balancer in the cluster manifest to distribute traffic across all worker nodes in the cluster.</div>
<div class="kg-bookmark-metadata"><img class="kg-bookmark-icon" src="https://www.digitalocean.com/apple-touch-icon.png"></div>
</div>
<div class="kg-bookmark-thumbnail"><img src="https://assets.digitalocean.com/articles/pdocs/docs-banner.png"></div></a></figure>