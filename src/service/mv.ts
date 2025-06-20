import service from './request';
export function getMvList({
  limit = 50, 
  offset = 0, area = '全部',
  order = '最热', type = '全部' 
}) {
  return service.get(`/mv/all?limit=${limit}&offset=${offset}&area=${area}&order=${order}&type=${type}`);
}
export function getMvDetail(mvid: number) {
  return service.get(`/mv/detail?mvid=${mvid}`);
}
export function getSimiMv(mvid: number) {
  return service.get(`/simi/mv?mvid=${mvid}`);
}
export function getVideoUrl(id: number) {
  return service.get(`/mv/url?id=${id}`);
}
export function getRecommendMv() {
  return service.get('/mv/first?limit=4');
}
export function getMvComment({ id='', limit = 20, offset = 0, before='' }) {
  let qs = `id=${id}&limit=${limit}&offset=${offset}&timestamp=${Date.now()}`;
  if (before) {
    qs+=`&before=${before}`;
  }
  return service.get(`/comment/mv?${qs}`);
}
