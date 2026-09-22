import {useEffect,useRef} from 'react';
import type {ReactNode} from 'react';
import {X} from 'lucide-react';
export function Modal({title,children,onClose,wide=false}:{title:string;children:ReactNode;onClose:()=>void;wide?:boolean}){const dialog=useRef<HTMLDialogElement>(null);useEffect(()=>{const el=dialog.current!;el.showModal();return()=>el.close();},[]);return <dialog className={`modal ${wide?'wide':''}`} ref={dialog} onCancel={e=>{e.preventDefault();onClose();}} onClick={e=>{if(e.target===dialog.current)onClose();}}><div className="modal-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={19}/></button></div>{children}</dialog>;}
