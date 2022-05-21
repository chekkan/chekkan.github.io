---
layout: post
title: Deploying GitHub packages docker image to Kubernetes
date: 2020-10-22 22:17:38
permalink: deploying-github-packages-docker-image-to-kubernetes
tags:
- kubernetes
- docker
- github
- container
---

GitHub had [announced a major feature][] on their platform which is
[GitHub packages][]. As well as hosting private **npm** or **NuGet**
registries, GitHub packages also includes private docker registries. If you use
GitHub for hosting your private project, it might make sense to use the private
docker registry from GitHub.

### Private Registry Authentication

Login to docker from your workstation with the **personal access token**. You
can find out more details about GitHub packages, and specifically about the
[token permissions][].

    cat ~/gh-do-package.txt | docker login https://docker.pkg.github.com -u USERNAME --password-stdin

Replace `USERNAME` with your GitHub username.

If you can see an auth key with your base64 encoded value, then create a
Kubernetes secret value.

    kubectl create secret generic ghregcred \
        --from-file=.dockerconfigjson=<path/to/.docker/config.json> \
        --type=kubernetes.io/dockerconfigjson

In my case however, the value is not available as I am using the `credStore`.
Therefore, I will have to create the secret using the command:

    kubectl create secret docker-registry ghregcred \
        --docker-server=docker.pkg.github.com \
        --docker-username=<your-name> \
        --docker-password=<your-pword> \
        --docker-email=<your-email>

where:

- `<your-name>` is your GitHub username.
- `<your-pword>` is your GitHub personal access token.
- `<your-email>` is your GitHub email.

You can inspect the value that was created with:

    kubectl get secret ghregcred --output=yaml

The output is similar to this:

```yaml
apiVersion: v1
kind: Secret
metadata:
    ...
    name: ghregcred
    ...
data:
    .dockerconfigjson: eyJodHRwczovL2luZGV4L ... J0QUl6RTIifX0=
type: kubernetes.io/dockerconfigjson
```

Read more about [inspecting the secret][].

### Create a Deployment that uses the secret

Create a `deployment.yaml` file as below with the `USERNAME`, `REPOSITORY` and
`mysecret` values replaced with the appropriate ones making sure the
indentation for `imagePullSecrets` matches.

```yaml
apiVersion: apps/v1 # for versions before 1.9.0 use apps/v1beta2
kind: Deployment
metadata:
  name: mysecret-deployment
spec:
  selector:
    matchLabels:
      app: mysecret
  replicas: 1 # tells deployment to run 1 pod matching the template
  template:
    metadata:
      labels:
        app: mysecret
    spec:
      containers:
      - name: mysecret
        image: docker.pkg.github.com/USERNAME/REPOSITORY/mysecret:latest
        ports:
        - containerPort: 8080
      imagePullSecrets:
      - name: ghregcred
``` 

Run the `kubectl apply` command pointing to the file.

     kubectl apply -f ./deployment.yaml

Display information about the Deployment:

     kubectl describe deployment mysecret-deployment

**Tip:** You can verify that the pod is deployed correct if its a web
application by using kube-proxy. Follow the url pattern
[`http://localhost:8001/api/v1/namespaces/xxx/pods/mysecret-deployment-xxx:/proxy/`]()

### Summary

You can follow the same steps to setup private docker registry authentication
for any registries that support docker's login protocol. All I did was put
together various docs already available; together.

[announced a major feature]: <https://github.blog/2019-05-10-introducing-github-package-registry/>
[GitHub packages]: <https://github.com/features/packages>
[token permissions]: <https://help.github.com/en/packages/publishing-and-managing-packages/about-github-packages#about-tokens>
[inspecting the secret]: <https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/#inspecting-the-secret-regcred>
