import service from './request';

export function getAlbumDetail(id:string) {
  return service.get('/album?id='+id);
}