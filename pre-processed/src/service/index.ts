import service from './request';
import placeholder from '@/assets/img/placeholder.png';
import subPlaceholder from '@/assets/img/sub-placeholder.png';
export function getBanner() {
    const banners = Array.from({ length: 10 }, (_, i) => ({
    imageUrl: i % 2 === 0 ? placeholder : subPlaceholder
  }));

  return Promise.resolve({
    data: {
      code: 200,
      banners
    }
  });
}
export function batchRequest(data: {
  [key: string]: any
}) {
  return service.post('/batch', data);
}
export * from './playlist';
export * from './songs';
export * from './search';
export * from './login';