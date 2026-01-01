import service from './request';
export function getBanner() {
    const banners = Array.from({ length: 10 }, (_, i) => ({
    imageUrl: i % 2 === 0 ? "https://dummyimage.com/1080x1080/0606fc/0606fc&text=1" : "https://dummyimage.com/1080x1080/ff0000/ff0000&text=1"
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
export * from './songs';
export * from './search';