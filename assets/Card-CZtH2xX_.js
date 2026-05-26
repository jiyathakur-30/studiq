import{u as t,v as i}from"./index-BhrByawJ.js";const l=({children:a,className:d="",hoverEffect:n=!0,onClick:r,delay:m=0,id:e})=>{const o={initial:{opacity:0,y:15},animate:{opacity:1,y:0},transition:{duration:.4,delay:m*.05,ease:[.16,1,.3,1]}},s=`
    premium-glass-card rounded-2xl shadow-sm border border-slate-200/60 dark:border-white/5
    ${n?"hover:scale-[1.005] hover:border-slate-300 dark:hover:border-white/10 hover:shadow-md":""}
    ${r?"cursor-pointer active:scale-98":""}
    transition-all duration-300 ${d}
  `;return r?t.jsx(i.div,{...o,onClick:r,className:s,id:e,children:a}):t.jsx(i.div,{...o,className:s,id:e,children:a})};export{l as C};
