---
layout: post
title: RxJS ajax builder for unit tests
tags:
- javascript
---

    import every from "lodash/every";
    import { EMPTY, of } from "rxjs";
    
    export const withUrl = (url) => ({
      specs = [],
      response = {},
      resHeaders = {},
    } = {}) => {
      const urlSpec = (param) => url === param.url;
      return { response, resHeaders, specs: [...specs, urlSpec] };
    };
    
    export const withAuthorization = (value) => ({
      specs = [],
      response = {},
      resHeaders = {},
    } = {}) => {
      const authSpec = (option) => option.headers.Authorization === value;
      return { response, resHeaders, specs: [...specs, authSpec] };
    };
    
    export const withResponse = (response) => ({
      specs = [],
      resHeaders = {},
    } = {}) => {
      return { specs, response, resHeaders };
    };
    
    export const withResponseHeader = (name, value) => ({
      specs = [],
      response = {},
      resHeaders = {},
    } = {}) => {
      const newResHeaders = { ...resHeaders, [name]: value };
      return { specs, response, resHeaders: newResHeaders };
    };
    
    export const buildAjax = ({
      specs = [],
      response = {},
      resHeaders = {},
    } = {}) => {
      return (option = { headers: {} }) => {
        if (every(specs, (spec) => spec(option))) {
          const xhr = { getResponseHeader: (key) => resHeaders[key] };
          return of({ response, xhr });
        }
        return EMPTY;
      };
    };

