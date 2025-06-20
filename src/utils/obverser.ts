class Observer {
  subscribes:{
    [key:string]:Function[]
  };
  constructor() {
    this.subscribes = {};
  }
  on(name:string, callback:(...data: any) => void) {
    if (!this.subscribes[name]) {
      this.subscribes[name] = [];
    }
    this.subscribes[name].push(callback);
  }
  emit(name:string, ...data: any[]) {
    if (!this.subscribes[name]) throw new Error('未找到订阅者');
    this.subscribes[name].forEach(fn => fn(...data));
  }
}

export default new Observer();