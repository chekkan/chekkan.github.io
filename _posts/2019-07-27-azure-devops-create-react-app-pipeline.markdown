---
layout: post
title: Azure DevOps Create React App Pipeline
date: '2019-07-27 22:35:00'
permalink: azure-devops-create-react-app-pipeline
tags:
- react
- azure
- azure-devops
- devops
- pipeline
- create-react-app
- continuous-integration
- ci
- yaml
---

The following azure pipeline yaml file works for 
[create-react-app][create-react-app] version 3.0.1.

Install the package `jest-junit` for unit test code coverage results to be 
published.

In the root of the repository, create a file called `azure-pipelines.yml` with 
the following content.

```yaml
trigger:
  - master

pool:
  vmImage: "Ubuntu-16.04"
steps:
  - task: NodeTool@0
    inputs:
      versionSpec: "10.x"
    displayName: "Install Node.js"

  - script: npm ci
    displayName: "npm ci"

  - script: npm run build
    displayName: "npm build"
    env:
      CI: true

  - script: npm test -- --coverage --ci --reporters=default --reporters=jest-junit --coverageReporters=cobertura
    displayName: "npm test"
    env:
      CI: true

  - task: PublishTestResults@2
    displayName: "Publish Test Results"
    inputs:
      testResultsFiles: junit.xml
      mergeTestResults: true
    condition: succeededOrFailed()

  - task: PublishCodeCoverageResults@1
    displayName: "Publish code coverage"
    inputs:
      codeCoverageTool: Cobertura
      summaryFileLocation: "$(System.DefaultWorkingDirectory)/coverage/cobertura-coverage.xml"
      reportDirectory: "$(System.DefaultWorkingDirectory)/coverage"
      failIfCoverageEmpty: true
```

### Install Node.js task

Even though the `pool` `vmImage` `Ubuntu-16.04` has a version of nodeJS 
installed already, this task is helpful to make sure the react app build will 
not start using a newer node version when the vm image updates.

### npm test task

At present with the script `npm test` on its own, the build will just run in 
watch mode. As the [docs][fb_cra_ci] at create react app suggests, adding an 
environment variable `CI` fixes this. This might get fixed in the future.

[create-react-app]: <https://github.com/facebook/create-react-app>
[fb_cra_ci]: <https://facebook.github.io/create-react-app/docs/running-tests#continuous-integration>