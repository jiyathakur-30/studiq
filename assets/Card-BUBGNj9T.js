import{o as e,p as i}from"./index-q5eQurvD.js";const l=({children:r,className:n="",hoverEffect:d=!0,onClick:a,delay:m=0,id:o})=>{const s={initial:{opacity:0,y:15},animate:{opacity:1,y:0},transition:{duration:.4,delay:m*.05,ease:[.16,1,.3,1]}},t=`
    premium-glass-card rounded-xl shadow-sm
    ${d?"hover:scale-[1.01] hover:border-brand-500/30 hover:shadow-glow-brand":""}
    ${a?"cursor-pointer active:scale-95":""}
    transition-all duration-300 ${n}
  `;return a?e.jsx(i.div,{...s,onClick:a,className:t,id:o,children:r}):e.jsx(i.div,{...s,className:t,id:o,children:r})};export{l as C};
