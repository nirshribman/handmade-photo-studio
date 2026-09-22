import type { Project } from './project';
export class History {
 past:Project[]=[]; future:Project[]=[]; private start:Project|null=null;
 begin(p:Project){if(!this.start)this.start=p;}
 commit(before:Project,after:Project){const original=this.start??before;this.start=null;if(JSON.stringify(original)===JSON.stringify(after))return;this.past.push(original);if(this.past.length>100)this.past.shift();this.future=[];}
 undo(p:Project){this.start=null;const last=this.past.pop();if(!last)return p;this.future.push(p);return last;}
 redo(p:Project){const next=this.future.pop();if(!next)return p;this.past.push(p);return next;}
 clear(){this.start=null;this.past=[];this.future=[];}
}
