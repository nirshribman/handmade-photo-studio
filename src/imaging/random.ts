// Integer avalanche hash. Identical input coordinates and unsigned seed give identical fields.
export function hash(x:number,y:number,seed:number){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+seed)|0;h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295;}
export const smooth=(t:number)=>t*t*(3-2*t);
export function noise(x:number,y:number,seed:number){const ix=Math.floor(x),iy=Math.floor(y),fx=smooth(x-ix),fy=smooth(y-iy);return (hash(ix,iy,seed)*(1-fx)+hash(ix+1,iy,seed)*fx)*(1-fy)+(hash(ix,iy+1,seed)*(1-fx)+hash(ix+1,iy+1,seed)*fx)*fy;}
