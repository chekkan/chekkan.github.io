---
layout: post
title: Setting Up Elasticsearch Cluster on Kubernetes - Part 4 - Statefulset
tags:
- elasticsearch
- docker
- container
- kubernetes
---

We've so far only been able to run elasticsearch as a single node cluster in these series of blog posts so far. I will try to address this issue in this blog post by leveraging the Kubernetes [statefulset](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/) and the [kubernetes discovery plugin](https://github.com/fabric8io/elasticsearch-cloud-kubernetes) for elasticsearch.

Kubernetes Discovery plugin is listed as one of the community driven plugin for discovery in the elasticsearch's [documentation site](https://www.elastic.co/guide/en/elasticsearch/plugins/current/discovery.html). In order to use the kubernetes discovery plugin, we will need to create an elasticsearch image with the plugin already installed. This has a nasty side affect of restricting the elasticsearch cluster version having to be the same as the plugin version. At the time of writing this post, the latest elasticsearch version supported by the kubernetes plugin is 6.1.2.

I will add the `Dockerfile` into our existing folder `elasticsearch-k8s`.

    FROM docker.elastic.co/elasticsearch/elasticsearch:6.1.2
    RUN elasticsearch-plugin install --batch io.fabric8:elasticsearch-cloud-kubernetes:6.1.2
    CMD ["/bin/bash", "bin/es-docker"]
    EXPOSE 9200 9300

I have already build this image and have made it publically available at docker hub.

