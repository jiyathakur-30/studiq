import{t as e,u as i}from"./index-6SIyq4_R.js";const u=({children:r,className:n="",hoverEffect:d=!0,onClick:a,delay:m=0,id:s})=>{const o={initial:{opacity:0,y:15},animate:{opacity:1,y:0},transition:{duration:.4,delay:m*.05,ease:[.16,1,.3,1]}},t=`
    premium-glass-card rounded-xl shadow-sm
    ${d?"hover:scale-[1.01] hover:border-brand-500/30 hover:shadow-glow-brand":""}
    ${a?"cursor-pointer active:scale-95":""}
    transition-all duration-300 ${n}
  `;return a?e.jsx(i.div,{...o,onClick:a,className:t,id:s,children:r}):e.jsx(i.div,{...o,className:t,id:s,children:r})};export{u as C};
