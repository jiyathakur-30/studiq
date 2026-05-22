import{m as t,n as e}from"./index-DaOxodG3.js";const c=({children:r,className:i="",hoverEffect:n=!0,onClick:a,delay:d=0})=>{const s={initial:{opacity:0,y:15},animate:{opacity:1,y:0},transition:{duration:.4,delay:d*.05,ease:[.16,1,.3,1]}},o=`
    premium-glass-card rounded-xl shadow-sm
    ${n?"hover:scale-[1.01] hover:border-brand-500/30 hover:shadow-glow-brand":""}
    ${a?"cursor-pointer active:scale-95":""}
    transition-all duration-300 ${i}
  `;return a?t.jsx(e.div,{...s,onClick:a,className:o,children:r}):t.jsx(e.div,{...s,className:o,children:r})};export{c as C};
