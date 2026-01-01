import { computed, onUnmounted, ref } from 'vue';
import type { AxiosResponse } from 'axios';
import { cloneDeep } from 'lodash';
export const useMemorizeRequest = (
  requestFn:(params:any) => Promise<AxiosResponse<any, any>>, requestKey:string, cacheTime = 180000
) => {
  const cacheResponseMap = new Map();
  const requestLoadingMaps = ref({ [requestKey]: true });
  const cacheTimeMap = new Map();
  const requestLoading = computed(() => {
    return requestLoadingMaps.value[requestKey];
  });
  const getKey = (params?:any) => {
    const cloneParams = cloneDeep(params || 'key');
    const key = requestKey + JSON.stringify(cloneParams);
    return key;
  };
  const wrapRequest = (params?:any) => {
    const key = getKey(params);
    const request = () => {
      const requestData = requestFn(params);
      cacheResponseMap.set(key, requestData);
      requestLoadingMaps.value[requestKey] = true;
      cacheTimeMap.set(key, Date.now());
      return requestData;
    };
    
    if (!cacheResponseMap.has(key)) {
      return request();
    } else {
      // if cache is expired, request again
      if (Date.now() - cacheTimeMap.get(key) > cacheTime) {
        return request();
      } 
      return cacheResponseMap.get(key);
    }
  };
  const removeCache = (params?:any) => {
    const key = getKey(params);
    if (cacheResponseMap.has(key)) {
      cacheResponseMap.delete(key);
    }
  };
  const loadSuccess = () => {
    requestLoadingMaps.value[requestKey] = false;
  };
  onUnmounted(() => {
    cacheResponseMap.clear();
  });
  
  return {
    wrapRequest,
    loadSuccess,
    removeCache,
    requestLoading
  };
};